'use client';

import { useState } from 'react';
import DropZone from '@/components/DropZone';
import ResultView from '@/components/ResultView';
import { AnalysisResult } from '@/types/analysis';
import { resizeImageBase64 } from '@/lib/imageUtils';

export default function AnalyzeClient() {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sideImage, setSideImage] = useState<string | null>(null);
    const [outsoleImage, setOutsoleImage] = useState<string | null>(null);

    const canAnalyze = sideImage && outsoleImage;

    const handleAnalyze = async () => {
        if (!sideImage || !outsoleImage) return;
        setIsAnalyzing(true);

        try {
            // 이미지 리사이징 (API 비용 절감)
            const [resizedSide, resizedOutsole] = await Promise.all([
                resizeImageBase64(sideImage),
                resizeImageBase64(outsoleImage),
            ]);

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sideImageBase64: resizedSide,
                    outsoleImageBase64: resizedOutsole,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setAnalysisResult(data as AnalysisResult);
        } catch (err: any) {
            alert('분석 중 오류 발생: ' + err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setSideImage(null);
        setOutsoleImage(null);
        setAnalysisResult(null);
    };

    // 결과 화면
    if (analysisResult) {
        return (
            <section id="analyze" className="section analyze">
                <div className="upload-section-wrapper">
                    <ResultView
                        result={analysisResult}
                        sideImage={sideImage!}
                        outsoleImage={outsoleImage!}
                        onReset={handleReset}
                    />
                </div>
            </section>
        );
    }

    // 업로드 화면
    return (
        <section id="analyze" className="section analyze">
            <div className="section-header">
                <h2>AI DIAGNOSIS</h2>
            </div>
            <div className="upload-section-wrapper">
                <div className="upload-zones-container">
                    <DropZone
                        label="신발 옆모습 (Side Profile)"
                        icon="👟"
                        description="브랜드 로고와 디자인이 잘 보이게<br/>옆면을 찍어주세요."
                        image={sideImage}
                        onImageChange={setSideImage}
                        disabled={isAnalyzing}
                    />
                    <DropZone
                        label="신발 밑창 (Outsole)"
                        icon="👣"
                        description="마모 상태 확인을 위해<br/>바닥면 전체를 찍어주세요."
                        image={outsoleImage}
                        onImageChange={setOutsoleImage}
                        disabled={isAnalyzing}
                    />
                </div>

                <button
                    id="analyze-btn"
                    className={`cta-button full-width ${canAnalyze ? 'pulse-animation' : ''}`}
                    disabled={!canAnalyze || isAnalyzing}
                    onClick={handleAnalyze}
                >
                    {isAnalyzing
                        ? '분석 중...'
                        : canAnalyze
                            ? 'AI 분석 시작하기 (Analyze)'
                            : '두 장의 사진을 모두 올려주세요'}
                </button>

                {isAnalyzing && (
                    <div className="scanner-overlay" id="scanner">
                        <div className="radar-scan"></div>
                        <div className="loading-bar-container">
                            <div className="loading-bar"></div>
                        </div>
                        <p className="scanning-text">두 장의 사진을 통합 분석 중입니다...</p>
                    </div>
                )}
            </div>
        </section>
    );
}
