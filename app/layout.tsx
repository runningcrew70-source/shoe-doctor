import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Shoe-Doctor | Run Better',
    description: 'AI 러닝화 마모 분석 솔루션 — 밑창 사진 한 장으로 주법 분석과 부상 방지 처방을 받아보세요.',
    openGraph: {
        title: 'Shoe-Doctor | AI 러닝화 분석',
        description: '러닝화 밑창 사진으로 주법을 분석하고 최적의 러닝화를 추천받으세요.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" className={inter.className}>
            <body>
                <div id="app">
                    <Navbar />
                    {children}
                    <footer>
                        <div className="footer-content">
                            <div className="footer-logo">SHOE-DOCTOR</div>
                            <p>&copy; 2024 Shoe-Doctor Analysis. All rights reserved.</p>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
