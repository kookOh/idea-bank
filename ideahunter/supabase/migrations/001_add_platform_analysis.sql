-- 앱인토스 플랫폼 분석 결과를 저장하는 JSONB 컬럼 추가
-- platform_analysis 구조: { ait_score, ait_category, ait_blocked_reason,
--   ait_ad_revenue_estimate, ait_target_type }
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_analysis jsonb;

CREATE INDEX IF NOT EXISTS idx_ideas_ait_score
  ON ideas(((platform_analysis->>'ait_score')::float) DESC NULLS LAST);
