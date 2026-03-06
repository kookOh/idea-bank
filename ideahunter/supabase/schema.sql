-- 아이디어 원본 수집 테이블
create table ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  source text not null,          -- 'hackernews' | 'reddit' | 'producthunt' | 'github'
  source_url text,
  score integer default 0,
  comment_count integer default 0,
  collected_at timestamptz default now(),

  -- AI 분석 결과
  summary_ko text,               -- 한국어 요약
  market_size text,              -- 시장 규모 추정
  difficulty integer,            -- 구현 난이도 1-5
  revenue_potential integer,     -- 수익 잠재력 1-5
  competition integer,           -- 경쟁 강도 1-5
  recommended_stack text[],      -- 추천 기술스택
  mvp_days integer,              -- MVP 예상 일수
  tags text[],                   -- 카테고리 태그
  trend_score float default 0,   -- 종합 트렌드 점수

  -- 프롬프트 생성 결과
  generated_prompts jsonb,       -- 생성된 Claude Code 프롬프트들
  implementation_status text default 'pending', -- pending | generating | done | error

  raw_data jsonb                 -- 원본 데이터
);

-- 일일 다이제스트
create table daily_digests (
  id uuid primary key default gen_random_uuid(),
  date date unique not null default current_date,
  top_ideas jsonb not null,      -- top 10 idea ids + 요약
  hot_topics text[],
  market_insights text,
  generated_at timestamptz default now()
);

-- 수집 로그
create table collect_logs (
  id uuid primary key default gen_random_uuid(),
  source text,
  collected_count integer,
  error text,
  ran_at timestamptz default now()
);

-- 인덱스
create index on ideas(collected_at desc);
create index on ideas(trend_score desc);
create index on ideas(source);

-- RLS (공개 읽기 허용)
alter table ideas enable row level security;
alter table daily_digests enable row level security;
create policy "public read" on ideas for select using (true);
create policy "public read" on daily_digests for select using (true);
create policy "service write" on ideas for all using (auth.role() = 'service_role');
create policy "service write" on daily_digests for all using (auth.role() = 'service_role');
