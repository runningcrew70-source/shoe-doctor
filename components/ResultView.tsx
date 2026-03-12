'use client';

import { AnalysisResult, Recommendation } from '@/types/analysis';

interface Props {
    result: AnalysisResult;
    sideImage: string;
    outsoleImage: string;
    onReset: () => void;
}

export default function ResultView({ result, sideImage, outsoleImage, onReset }: Props) {
    const data = result?.diagnosis;
    const modelInfo = result?.model_info;
    const recommendations: Recommendation[] = result?.recommendations ?? [];

    const wear = data?.wear_percentage ?? 0;
    let lifeLeft = 100 - wear;
    if (lifeLeft < 0) lifeLeft = 0;
    if (lifeLeft > 100) lifeLeft = 100;

    let barColor = '#00ff00';
    let lifeStatusText = '양호 (Good)';
    if (lifeLeft >= 80) {
        barColor = '#00ff00';
        lifeStatusText = '최상 (Excellent)';
    } else if (lifeLeft >= 40) {
        barColor = '#ffa500';
        lifeStatusText = '주의 (Warning)';
    } else {
        barColor = '#ff3333';
        lifeStatusText = '교체 요망 (Critical)';
    }

    const brandName = modelInfo?.brand ?? 'Unknown';
    const modelName = modelInfo?.model ?? 'Unknown';

    return (
        <div className="result-view" id="result-view">
            <div className="result-card">
                <div className="result-data">
                    <div className="medical-chart-container">
                        {/* 업로드된 사진 썸네일 */}
                        <div className="chart-header">
                            <div className="chart-thumbnail-wrapper">
                                <span className="chart-label">측면 (Side)</span>
                                <img src={sideImage} className="chart-thumbnail" alt="Side Profile" />
                            </div>
                            <div className="chart-thumbnail-wrapper">
                                <span className="chart-label">밑창 (Outsole)</span>
                                <img src={outsoleImage} className="chart-thumbnail" alt="Outsole" />
                            </div>
                        </div>

                        {/* 모델 정보 및 수명 바 */}
                        <div className="chart-model-info">
                            <h2 className="chart-model-name">{brandName} {modelName}</h2>
                            <div className="life-bar-container">
                                <div className="life-bar-text">
                                    현재 잔여 수명: <span className="life-value" style={{ color: barColor }}>{lifeLeft}%</span> ({lifeStatusText})
                                </div>
                                <div className="life-bar-bg">
                                    <div className="life-bar-fill" style={{ width: `${lifeLeft}%`, backgroundColor: barColor }}></div>
                                </div>
                            </div>
                            <div className="chart-divider" style={{ marginTop: '20px' }}></div>
                        </div>

                        {/* 3단 진단 */}
                        <div className="diagnosis-section">
                            <div className="diagnosis-item">
                                <h3 className="diagnosis-title">🩺 [종합 진단]</h3>
                                <p className="diagnosis-content">{data?.section_1_overall ?? '진단 데이터 없음'}</p>
                            </div>
                            <div className="diagnosis-item">
                                <h3 className="diagnosis-title">🏃 [주법 분석]</h3>
                                <p className="diagnosis-content">{data?.section_2_gait ?? '분석 데이터 없음'}</p>
                            </div>
                            <div className="diagnosis-item">
                                <h3 className="diagnosis-title">💪 [닥터의 처방]</h3>
                                <p className="diagnosis-content">{data?.section_3_prescription ?? '처방 데이터 없음'}</p>
                            </div>
                        </div>
                    </div>

                    {/* 노피 배너 */}
                    <div
                        className="promo-banner"
                        id="nopi-banner"
                        style={{ cursor: 'pointer' }}
                        onClick={() => window.open('https://instagram.com/nopi_running', '_blank')}
                    >
                        <div className="promo-banner-bg"></div>
                        <div className="promo-banner-overlay">
                            <h3>혼자 뛰기 심심한가요?</h3>
                            <p>서귀포 노피(Nopi) 러닝 투어에 초대합니다!</p>
                        </div>
                    </div>

                    {/* 추천 러닝화 */}
                    <div className="prescription-section">
                        <h3>처방전: 추천 러닝화</h3>
                        <div className="prescribed-shoes-list">
                            {recommendations.map((shoe, idx) => {
                                const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent((shoe.brand ?? '') + ' ' + (shoe.model ?? ''))}`;
                                return (
                                    <div key={idx} className="recommend-card-small">
                                        <div className="rec-info">
                                            <span className="rec-brand">{shoe.brand ?? ''}</span>
                                            <span className="rec-model">{shoe.model ?? ''}</span>
                                            <span className="rec-type">{shoe.type ?? 'Stability'}</span>
                                        </div>
                                        <a href={searchUrl} target="_blank" rel="noreferrer" className="cta-button-conversion">최저가 확인 🚀</a>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button className="cta-button secondary" onClick={onReset}>다른 신발 분석하기</button>
                </div>
            </div>
        </div>
    );
}
