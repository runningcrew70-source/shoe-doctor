-- ============================================================
-- 슈닥터 데이터 수집 스키마
-- Supabase SQL Editor에서 이 파일의 내용을 실행하세요.
-- ============================================================

-- 1. 분석 기록 테이블
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 이미지 경로 (Supabase Storage 내 경로)
  side_image_path TEXT NOT NULL,
  outsole_image_path TEXT NOT NULL,

  -- GPT 인식 결과
  brand TEXT,
  model TEXT,

  -- 진단 결과
  wear_percentage INTEGER,
  gait_type TEXT,          -- 'Neutral' | 'Overpronation' | 'Supination'
  life_status TEXT,

  -- 전체 JSON 응답 보관 (원본 데이터 손실 방지)
  raw_result JSONB NOT NULL,

  -- 메타데이터
  ip_address TEXT
);

-- 2. 통계 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_analyses_brand_model ON analyses(brand, model);
CREATE INDEX IF NOT EXISTS idx_analyses_gait_type ON analyses(gait_type);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- 3. Supabase Storage 버킷 생성 (SQL Editor에서는 실행 불가 — 대시보드에서 수동 생성 필요)
-- 버킷 이름: shoe-images
-- 공개 여부: Public (이미지를 ResultView에서 보여줄 수 있도록)
-- 허용 MIME: image/jpeg, image/png, image/webp
