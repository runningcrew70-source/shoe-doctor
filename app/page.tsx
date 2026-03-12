import Hero from '@/components/Hero';
import ShopSection from '@/components/ShopSection';
import AnalyzeClient from '@/components/AnalyzeClient';

// Features 데이터 배열 (하드코딩 → 데이터 분리)
const FEATURES = [
    {
        step: '01',
        title: 'IMAGE UPLOAD',
        description: '마모된 러닝화 밑창 사진을 업로드하세요.\n선명할수록 정확도가 높아집니다.',
    },
    {
        step: '02',
        title: 'AI ANALYSIS',
        description: '슈닥터만의 딥러닝 알고리즘이\n마모 패턴을 0.1mm 단위로 분석합니다.',
    },
    {
        step: '03',
        title: 'OPTIMIZATION',
        description: '분석된 데이터를 바탕으로\n부상 방지를 위한 최적의 기어를 제안합니다.',
    },
];

// 서버 컴포넌트 (SEO 최적화, 'use client' 없음)
export default function Home() {
    return (
        <>
            <Hero />

            <section id="features" className="section features">
                <div className="section-header">
                    <h2>PROCESS</h2>
                </div>
                <div className="feature-grid">
                    {FEATURES.map((feature) => (
                        <div key={feature.step} className="feature-card">
                            <div className="icon-box">{feature.step}</div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <AnalyzeClient />

            <ShopSection />
        </>
    );
}
