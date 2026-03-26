// Google Analytics 4 유틸리티
// 환경변수: NEXT_PUBLIC_GA_ID (예: G-XXXXXXXXXX)

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// 페이지뷰 트래킹
export const pageview = (url: string) => {
    if (!GA_ID || typeof window === 'undefined') return;
    (window as any).gtag('config', GA_ID, {
        page_path: url,
    });
};

// 커스텀 이벤트 트래킹
export const event = ({
    action,
    category,
    label,
    value,
}: {
    action: string;
    category: string;
    label?: string;
    value?: number;
}) => {
    if (!GA_ID || typeof window === 'undefined') return;
    (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
    });
};

// === 미리 정의된 이벤트 헬퍼 ===

// 분석 시작
export const trackAnalysisStart = () =>
    event({ action: 'analysis_start', category: 'engagement' });

// 분석 완료
export const trackAnalysisComplete = (brand: string, model: string, wearPercent: number) =>
    event({
        action: 'analysis_complete',
        category: 'engagement',
        label: `${brand} ${model}`,
        value: wearPercent,
    });

// 이미지 저장
export const trackImageSave = () =>
    event({ action: 'image_save', category: 'sharing' });

// SNS 공유
export const trackShare = (platform: string) =>
    event({ action: 'share', category: 'sharing', label: platform });

// 쿠팡 링크 클릭
export const trackCoupangClick = (shoeModel: string) =>
    event({ action: 'coupang_click', category: 'conversion', label: shoeModel });
