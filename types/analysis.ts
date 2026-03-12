// AI 분석 응답 인터페이스 정의

export interface ModelInfo {
    brand: string;
    model: string;
    display_text: string;
    confidence: string;
}

export interface Diagnosis {
    section_1_overall: string;
    section_2_gait: string;
    section_3_prescription: string;
    wear_percentage: number;
    life_status: string;
}

export interface Recommendation {
    brand: string;
    model: string;
    type: string;
    brand_color_hex: string;
}

export interface AnalysisResult {
    is_shoe: boolean;
    model_info: ModelInfo;
    diagnosis: Diagnosis;
    recommendations: Recommendation[];
}

export interface AnalyzeRequest {
    sideImageBase64: string;
    outsoleImageBase64: string;
}

export interface AnalyzeError {
    error: string;
}
