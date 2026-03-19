import { createClient } from '@supabase/supabase-js';

// ============================================================
// Supabase 서버 전용 클라이언트 (Service Role Key 사용)
// API Route에서만 사용 — 클라이언트 컴포넌트에 노출 금지
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase] 환경 변수가 설정되지 않았습니다. 데이터 저장이 비활성화됩니다.');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});
