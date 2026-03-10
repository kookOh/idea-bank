-- ============================================================
-- IdeaHunter 전체 데이터베이스 스키마
-- PostgreSQL (Supabase) 기준
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. ideas 테이블: 아이디어 원본 수집 + AI 분석 결과
-- ──────────────────────────────────────────────────────────────
CREATE TABLE ideas (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text         NOT NULL,
  description           text,

  -- 수집 소스 정보
  source                text         NOT NULL,           -- 'hackernews' | 'reddit' | 'producthunt' | 'github' | 'playstore' | 'appstore'
  source_url            text,
  score                 integer      DEFAULT 0,          -- 소스 업보트/점수
  comment_count         integer      DEFAULT 0,
  collected_at          timestamptz  DEFAULT now(),

  -- AI 분석 결과 (Groq llama-3.1-8b-instant)
  summary_ko            text,                            -- 한국어 요약
  market_size           text,                            -- 시장 규모 추정
  difficulty            integer      CHECK (difficulty BETWEEN 1 AND 5),         -- 구현 난이도 1-5
  revenue_potential     integer      CHECK (revenue_potential BETWEEN 1 AND 5),  -- 수익 잠재력 1-5
  competition           integer      CHECK (competition BETWEEN 1 AND 5),        -- 경쟁 강도 1-5
  recommended_stack     text[],                          -- 추천 기술 스택
  mvp_days              integer,                         -- MVP 예상 개발 일수
  tags                  text[],                          -- 카테고리 태그
  trend_score           float        DEFAULT 0,          -- 종합 트렌드 점수

  -- Claude Code 프롬프트 생성 결과
  generated_prompts     jsonb,                           -- { default?: GeneratedPrompts, appintoss?: GeneratedPrompts }
  implementation_status text         DEFAULT 'pending',  -- 'pending' | 'generating' | 'analyzing' | 'done' | 'error'

  -- 앱인토스 플랫폼 분석 결과
  platform_analysis     jsonb,                           -- { ait_score, ait_category, ait_blocked_reason, ait_ad_revenue_estimate, ait_target_type }

  -- 원본 데이터
  raw_data              jsonb                            -- 수집 원본 JSON
);

-- ideas 인덱스
CREATE INDEX idx_ideas_collected_at   ON ideas (collected_at DESC);
CREATE INDEX idx_ideas_trend_score    ON ideas (trend_score DESC);
CREATE INDEX idx_ideas_source         ON ideas (source);
CREATE INDEX idx_ideas_status         ON ideas (implementation_status);
CREATE INDEX idx_ideas_source_date    ON ideas (source, collected_at DESC);

-- platform_analysis JSONB 내부 ait_score에 대한 표현식 인덱스
CREATE INDEX idx_ideas_ait_score
  ON ideas (((platform_analysis->>'ait_score')::float) DESC NULLS LAST);

-- platform_analysis JSONB GIN 인덱스 (임의 키 검색, 예: ait_category 필터)
CREATE INDEX idx_ideas_platform_analysis_gin
  ON ideas USING GIN (platform_analysis jsonb_path_ops);

-- tags 배열 GIN 인덱스 (contains 쿼리 최적화)
CREATE INDEX idx_ideas_tags_gin
  ON ideas USING GIN (tags);


-- ──────────────────────────────────────────────────────────────
-- 2. daily_digests 테이블: 일일 다이제스트 (TOP 10)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE daily_digests (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  date             date         UNIQUE NOT NULL DEFAULT current_date,
  top_ideas        jsonb        NOT NULL,       -- 상위 10개 아이디어 id + 요약
  hot_topics       text[],                      -- AI 분석 핫 토픽 키워드 3-5개
  market_insights  text,                        -- AI 생성 시장 트렌드 인사이트
  generated_at     timestamptz  DEFAULT now()
);


-- ──────────────────────────────────────────────────────────────
-- 3. collect_logs 테이블: 수집 실행 로그
-- ──────────────────────────────────────────────────────────────
CREATE TABLE collect_logs (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  source           text,                        -- 'hackernews' | 'reddit' | ... | 'all'
  collected_count  integer,                     -- 실제 수집/삽입된 건수
  error            text,                        -- 에러 메시지 (성공 시 null)
  ran_at           timestamptz  DEFAULT now()
);


-- ══════════════════════════════════════════════════════════════
-- RLS (Row Level Security) 정책
-- ══════════════════════════════════════════════════════════════

-- ideas: 공개 읽기 + 서비스 역할만 쓰기
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideas_public_read"
  ON ideas FOR SELECT
  USING (true);

CREATE POLICY "ideas_service_write"
  ON ideas FOR ALL
  USING (auth.role() = 'service_role');

-- daily_digests: 공개 읽기 + 서비스 역할만 쓰기
ALTER TABLE daily_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "digests_public_read"
  ON daily_digests FOR SELECT
  USING (true);

CREATE POLICY "digests_service_write"
  ON daily_digests FOR ALL
  USING (auth.role() = 'service_role');

-- collect_logs: 서비스 역할만 읽기/쓰기 (내부 전용)
ALTER TABLE collect_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs_service_only"
  ON collect_logs FOR ALL
  USING (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════
-- 마이그레이션: platform_analysis 컬럼 추가 (기존 테이블 대상)
-- 파일: supabase/migrations/001_add_platform_analysis.sql
-- ══════════════════════════════════════════════════════════════
-- 이미 위 CREATE TABLE에 포함되어 있으므로,
-- 기존 배포된 DB에 대해서만 아래 마이그레이션을 실행합니다.

-- ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_analysis jsonb;
--
-- CREATE INDEX IF NOT EXISTS idx_ideas_ait_score
--   ON ideas (((platform_analysis->>'ait_score')::float) DESC NULLS LAST);
--
-- CREATE INDEX IF NOT EXISTS idx_ideas_platform_analysis_gin
--   ON ideas USING GIN (platform_analysis jsonb_path_ops);
