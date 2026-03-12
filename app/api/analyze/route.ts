import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/lib/prompts';

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

        // 4. OpenAI API 호출
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
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

        // 5. 응답 파싱 (JSON.parse 분리된 에러 핸들링)
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

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json(
            { error: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
