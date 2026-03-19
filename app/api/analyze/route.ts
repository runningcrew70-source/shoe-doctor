import { NextResponse } from 'next/server';
import { buildSystemPrompt, USER_PROMPT } from '@/lib/prompts';
import { supabaseAdmin } from '@/lib/supabase';
import { getGlobalStats, getModelStats } from '@/lib/stats';

// ============================================================
// Rate Limiting (인메모리 — IP당 분당 5회)
// ============================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return true;
    return false;
}

// ============================================================
// 입력 검증
// ============================================================
const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB per image (Base64)

function validateBase64Image(data: unknown): data is string {
    if (typeof data !== 'string') return false;
    if (!data.startsWith('data:image/')) return false;
    return true;
}

// ============================================================
// Base64 → Buffer 변환 (Supabase Storage 업로드용)
// ============================================================
function base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
    const matches = base64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 image');
    return {
        buffer: Buffer.from(matches[2], 'base64'),
        mimeType: matches[1],
    };
}

// ============================================================
// POST Handler
// ============================================================
export async function POST(req: Request) {
    try {
        // 1. Rate Limiting
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = forwardedFor?.split(',')[0]?.trim() ?? 'unknown';
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: '요청이 너무 잦습니다. 1분 후 다시 시도해주세요.' },
                { status: 429 }
            );
        }

        // 2. 페이로드 파싱 및 검증
        const body = await req.json();
        const { sideImageBase64, outsoleImageBase64 } = body;

        if (!validateBase64Image(sideImageBase64) || !validateBase64Image(outsoleImageBase64)) {
            return NextResponse.json(
                { error: '올바른 이미지 형식(Base64)이 아닙니다. 두 장의 사진을 다시 업로드해주세요.' },
                { status: 400 }
            );
        }

        // 이미지 사이즈 제한
        if (sideImageBase64.length > MAX_PAYLOAD_SIZE || outsoleImageBase64.length > MAX_PAYLOAD_SIZE) {
            return NextResponse.json(
                { error: '이미지 크기가 너무 큽니다 (최대 4MB). 해상도를 줄여서 다시 시도해주세요.' },
                { status: 413 }
            );
        }

        // 3. API 키 확인
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: '서버에 API 키가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        // 4. 축적 데이터 통계 가져오기 (실패해도 분석은 진행)
        let globalStats = { totalAnalyses: 0, avgWear: 0, neutralPct: 0, overpronationPct: 0, supinationPct: 0 };
        try {
            globalStats = await getGlobalStats();
            console.log(`[Stats] 축적 데이터 ${globalStats.totalAnalyses}건 기반 프롬프트 생성`);
        } catch (err) {
            console.warn('[Stats] 통계 조회 실패, 기본 프롬프트 사용:', err);
        }

        // 5. 동적 시스템 프롬프트 생성
        const systemPrompt = buildSystemPrompt(globalStats);

        // 6. OpenAI API 호출
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: USER_PROMPT },
                            { type: 'image_url', image_url: { url: sideImageBase64, detail: 'high' } },
                            { type: 'image_url', image_url: { url: outsoleImageBase64, detail: 'high' } },
                        ],
                    },
                ],
                max_tokens: 1500,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = (errorData as any)?.error?.message ?? 'OpenAI API 호출에 실패했습니다.';
            return NextResponse.json({ error: message }, { status: response.status });
        }

        // 7. 응답 파싱
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: 'AI로부터 응답을 받지 못했습니다. 다시 시도해주세요.' },
                { status: 502 }
            );
        }

        let result;
        try {
            result = JSON.parse(content);
        } catch {
            console.error('GPT JSON parse failure. Raw content:', content);
            return NextResponse.json(
                { error: 'AI 응답을 해석할 수 없습니다. 다시 시도해주세요.' },
                { status: 502 }
            );
        }

        // ============================================================
        // 8. 데이터 수집: 이미지 & 분석 결과를 Supabase에 저장
        //    저장 실패 시 로그만 남기고 사용자에게는 정상 응답 반환
        // ============================================================
        try {
            const timestamp = Date.now();
            const sideImagePath = `analyses/${timestamp}_side.jpg`;
            const outsoleImagePath = `analyses/${timestamp}_outsole.jpg`;

            // 이미지를 Supabase Storage에 업로드
            const sideData = base64ToBuffer(sideImageBase64);
            const outsoleData = base64ToBuffer(outsoleImageBase64);

            await Promise.all([
                supabaseAdmin.storage.from('shoe-images').upload(sideImagePath, sideData.buffer, {
                    contentType: sideData.mimeType,
                    upsert: false,
                }),
                supabaseAdmin.storage.from('shoe-images').upload(outsoleImagePath, outsoleData.buffer, {
                    contentType: outsoleData.mimeType,
                    upsert: false,
                }),
            ]);

            // 분석 결과의 gait_type 추출 (프롬프트에서 요청한 필드)
            const diagnosis = result?.diagnosis;
            let gaitType = diagnosis?.gait_type ?? null;

            // gait_type이 없으면 section_2_gait 텍스트에서 추론
            if (!gaitType && diagnosis?.section_2_gait) {
                const gaitText = diagnosis.section_2_gait.toLowerCase();
                if (gaitText.includes('supination') || gaitText.includes('회외')) gaitType = 'Supination';
                else if (gaitText.includes('overpronation') || gaitText.includes('과회내') || gaitText.includes('pronation')) gaitType = 'Overpronation';
                else if (gaitText.includes('neutral') || gaitText.includes('중립')) gaitType = 'Neutral';
            }

            // 분석 결과를 DB에 저장
            const { error: dbError } = await supabaseAdmin.from('analyses').insert({
                side_image_path: sideImagePath,
                outsole_image_path: outsoleImagePath,
                brand: result?.model_info?.brand ?? null,
                model: result?.model_info?.model ?? null,
                wear_percentage: diagnosis?.wear_percentage ?? null,
                gait_type: gaitType,
                life_status: diagnosis?.life_status ?? null,
                raw_result: result,
                ip_address: ip,
            });

            if (dbError) {
                console.error('[DB] 저장 실패:', dbError.message);
            } else {
                console.log(`[DB] 분석 결과 저장 완료 (${result?.model_info?.brand} ${result?.model_info?.model})`);
            }
        } catch (saveError) {
            console.error('[Data Collection] 저장 중 오류 (분석 결과는 정상 반환):', saveError);
        }

        // 9. 사용자에게 분석 결과 반환 (저장 성공/실패와 무관)
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json(
            { error: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
