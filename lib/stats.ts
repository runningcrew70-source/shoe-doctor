import { supabaseAdmin } from './supabase';
import { GlobalStats, ModelStats } from '@/types/analysis';

// ============================================================
// 축적 데이터 통계 집계
// GPT 프롬프트에 실제 데이터 기반 컨텍스트를 제공하기 위한 함수들
// ============================================================

/**
 * 전체 분석 통계를 집계합니다.
 * - 총 분석 건수
 * - 평균 마모율
 * - 주법 분포 (Neutral / Overpronation / Supination)
 */
export async function getGlobalStats(): Promise<GlobalStats> {
    const defaultStats: GlobalStats = {
        totalAnalyses: 0,
        avgWear: 0,
        neutralPct: 0,
        overpronationPct: 0,
        supinationPct: 0,
    };

    try {
        // 총 분석 건수 & 평균 마모율
        const { count } = await supabaseAdmin
            .from('analyses')
            .select('*', { count: 'exact', head: true });

        if (!count || count === 0) return defaultStats;

        const { data: wearData } = await supabaseAdmin
            .from('analyses')
            .select('wear_percentage');

        const avgWear = wearData && wearData.length > 0
            ? Math.round(wearData.reduce((sum, r) => sum + (r.wear_percentage ?? 0), 0) / wearData.length)
            : 0;

        // 주법 분포
        const { data: gaitData } = await supabaseAdmin
            .from('analyses')
            .select('gait_type');

        let neutral = 0, overpronation = 0, supination = 0;
        if (gaitData) {
            for (const row of gaitData) {
                const gait = (row.gait_type ?? '').toLowerCase();
                if (gait.includes('neutral')) neutral++;
                else if (gait.includes('overpronation') || gait.includes('pronation')) overpronation++;
                else if (gait.includes('supination')) supination++;
            }
        }

        const total = count;

        return {
            totalAnalyses: total,
            avgWear,
            neutralPct: Math.round((neutral / total) * 100),
            overpronationPct: Math.round((overpronation / total) * 100),
            supinationPct: Math.round((supination / total) * 100),
        };
    } catch (error) {
        console.error('[Stats] 통계 집계 실패:', error);
        return defaultStats;
    }
}

/**
 * 특정 모델의 통계를 집계합니다.
 * 동일 모델을 사용하는 사람들의 평균 마모율 비교에 사용
 */
export async function getModelStats(brand: string, model: string): Promise<ModelStats | null> {
    try {
        const { data, count } = await supabaseAdmin
            .from('analyses')
            .select('wear_percentage', { count: 'exact' })
            .ilike('brand', brand)
            .ilike('model', `%${model}%`);

        if (!data || !count || count < 2) return null; // 비교 데이터 2건 이상일 때만

        const avgWear = Math.round(
            data.reduce((sum, r) => sum + (r.wear_percentage ?? 0), 0) / data.length
        );

        return {
            model: `${brand} ${model}`,
            avgWear,
            count,
        };
    } catch (error) {
        console.error('[Stats] 모델 통계 집계 실패:', error);
        return null;
    }
}
