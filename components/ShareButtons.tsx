'use client';

import { useState } from 'react';
import { trackShare } from '@/lib/analytics';

interface ShareButtonsProps {
    title: string;
    description: string;
}

export default function ShareButtons({ title, description }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const getShareUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.href;
        }
        return '';
    };

    const shareText = `${title}\n${description}`;

    // 📱 Web Share API (모바일: 카카오톡, 문자, 인스타 등 모든 앱)
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: description,
                    url: getShareUrl(),
                });
                trackShare('native');
            } catch (err: any) {
                // 사용자가 취소한 경우 무시
                if (err.name !== 'AbortError') {
                    console.error('공유 실패:', err);
                }
            }
        } else {
            // 데스크탑 등 Web Share API 미지원 시 URL 복사로 대체
            handleCopyUrl();
        }
    };

    // 트위터(X) 공유
    const handleTwitterShare = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`;
        window.open(url, '_blank', 'width=600,height=400');
        trackShare('twitter');
    };

    // 페이스북 공유
    const handleFacebookShare = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
        trackShare('facebook');
    };

    // URL 복사
    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            trackShare('url_copy');
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = getShareUrl();
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            trackShare('url_copy');
        }
    };

    return (
        <div className="share-section">
            <h3 className="share-title">📤 분석 결과 공유하기</h3>
            <div className="share-buttons">
                <button
                    className="share-btn share-btn-native"
                    onClick={handleNativeShare}
                    id="share-native"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>공유하기</span>
                </button>

                <button
                    className="share-btn share-btn-twitter"
                    onClick={handleTwitterShare}
                    id="share-twitter"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>X (트위터)</span>
                </button>

                <button
                    className="share-btn share-btn-facebook"
                    onClick={handleFacebookShare}
                    id="share-facebook"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.875v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>페이스북</span>
                </button>

                <button
                    className={`share-btn share-btn-copy ${copied ? 'copied' : ''}`}
                    onClick={handleCopyUrl}
                    id="share-copy"
                >
                    {copied ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                    )}
                    <span>{copied ? '복사됨!' : 'URL 복사'}</span>
                </button>
            </div>
        </div>
    );
}
