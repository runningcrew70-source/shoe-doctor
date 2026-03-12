/**
 * 클라이언트 이미지 리사이징 유틸리티
 * 업로드 전 Canvas API로 이미지를 축소하여 API 비용 및 전송 시간 절감
 */

const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;
const QUALITY = 0.85;

export function resizeImageBase64(base64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // 리사이징이 필요 없으면 원본 반환
            if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
                resolve(base64);
                return;
            }

            // 비율 유지 리사이징
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context 생성 실패'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const resized = canvas.toDataURL('image/jpeg', QUALITY);
            resolve(resized);
        };
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = base64;
    });
}
