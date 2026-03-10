# IdeaHunter - Master Blueprint Part 2: 기술 아키텍처

> 최종 업데이트: 2026-03-10
> 버전: v0.4 (Foundation Pack)

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처 다이어그램

```
+---------------------------------------------------------------------+
|                        사용자 (브라우저)                                |
|   +----------+  +--------------+  +------------------+               |
|   | 메인 피드  |  | 다이제스트     |  | 앱인토스 대시보드   |               |
|   | /         |  | /digest      |  | /ait             |               |
|   +-----+----+  +------+-------+  +------+-----------+               |
+---------+---------------+----------------+---------------------------+
          |               |                |
          v               v                v
+---------------------------------------------------------------------+
|                    Next.js 16.1.6 App Router (Vercel)                |
|                                                                     |
|  API Routes:                                                        |
|  +-------------------+  +------------------------------------+      |
|  | /api/ideas         |  | /api/ideas/[id]/generate-prompts   |      |
|  | (목록 조회/필터)     |  | (프롬프트 생성, 원자적 잠금)          |      |
|  +-------------------+  +------------------------------------+      |
|  +-------------------+  +------------------------------------+      |
|  | /api/digest        |  | /api/ideas/[id]/analyze-ait        |      |
|  | (다이제스트 조회)     |  | (앱인토스 적합도 분석)                |      |
|  +-------------------+  +------------------------------------+      |
|  +-------------------+  +------------------------------------+      |
|  | /api/cron/collect  |  | /api/ideas/[id]/save-prompts       |      |
|  | (수집 CRON)         |  | (브릿지 결과 저장)                   |      |
|  +-------------------+  +------------------------------------+      |
|  +-------------------+                                              |
|  | /api/cron/digest   |                                              |
|  | (다이제스트 CRON)    |                                              |
|  +-------------------+                                              |
+----------+------------------------------+---------------------------+
           |                              |
           v                              v
+---------------------+    +------------------------------------------+
|   Supabase           |    |        AI 프로바이더 폴백 체인              |
|   (PostgreSQL)       |    |                                          |
|                      |    |  1순위: 로컬 브릿지 서버 (localhost:3100)   |
|  +----------------+  |    |    +-- Claude Code CLI                   |
|  | ideas          |  |    |    +-- Codex CLI                         |
|  | daily_digests  |  |    |                                          |
|  | collect_logs   |  |    |  2순위: Groq Cloud API                    |
|  +----------------+  |    |    +-- llama-3.1-8b-instant (분석)        |
|                      |    |    +-- llama-3.3-70b-versatile (프롬프트)  |
|  RLS: 공개 읽기       |    |                                          |
|  service_role 쓰기    |    |  3순위: 폴백 기본값 (하드코딩 템플릿)       |
+---------------------+    +------------------------------------------+
           ^
           |
+----------+------------------------------------------------------+
|                     외부 데이터 소스 (7개 수집 대상)                  |
|                                                                   |
|  +-----------+ +--------+ +-------------+ +--------+             |
|  | HackerNews | | Reddit | | ProductHunt | | GitHub |             |
|  | (API)      | | (JSON) | | (Bearer)    | | (API)  |             |
|  +-----------+ +--------+ +-------------+ +--------+             |
|  +-----------+ +----------+ +----------+                         |
|  | PlayStore  | | AppStore | | AppBrain |                         |
|  | (스크래핑)  | | (RSS)    | | (스크래핑) |                         |
|  +-----------+ +----------+ +----------+                         |
+------------------------------------------------------------------+
```

### 1.2 기술 스택 선정 근거

**프레임워크 & 런타임:**

| 기술 | 버전 | 선정 근거 |
|------|------|-----------|
| Next.js | 16.1.6 | App Router 기반 풀스택. API Routes로 별도 백엔드 불필요. Vercel 네이티브 배포. Turbopack dev |
| React | 19.2.3 | 최신 React 19. Server Components, Suspense, `use` hook 지원 |
| TypeScript | 5.9.3 | strict 모드. `types/idea.ts` 공통 타입으로 프론트/백엔드 타입 안전성 보장 |

**데이터 & 인프라:**

| 기술 | 선정 근거 |
|------|-----------|
| Supabase (PostgreSQL) | PostgreSQL + Auth + Storage + Realtime 올인원. Free 플랜 500MB DB, 50K MAU |
| Vercel | Next.js 네이티브 배포. Cron Jobs (Hobby: 1일 1회). Edge Functions. CDN 캐시 |
| GitHub Actions | CI/CD 파이프라인. 무료 (public 2,000분/월) |

**AI & LLM:**

| 기술 | 모델 | 용도 | 선정 근거 |
|------|------|------|-----------|
| Groq SDK (0.37.0) | llama-3.1-8b-instant | 아이디어 분석, AIT 적합도 분석, 다이제스트 생성 | 무료 API. 초당 ~750 토큰. 가벼운 분석에 적합 |
| Groq SDK | llama-3.3-70b-versatile | 프롬프트 기술 상세 생성 (DB/API/UI/기능) | 무료 API. 70B 모델로 고품질 기술 명세 생성 |
| 로컬 브릿지 | Claude Code CLI / Codex CLI | 프롬프트 생성 (최우선) | 로컬 실행으로 무료 + 최고 품질. CLI 설치 시에만 활성화 |

**UI & 스타일링:**

| 기술 | 선정 근거 |
|------|-----------|
| Tailwind CSS 4 | 유틸리티 우선 CSS. @tailwindcss/postcss 빌드. 다크모드 기본 (bg-gray-950) |
| Radix UI (@radix-ui/react-dialog) | 접근성(a11y) 완비 headless Dialog. 포커스 트랩, ESC 닫기 |

**테스트:**

| 기술 | 용도 | 선정 근거 |
|------|------|-----------|
| Jest 30 + ts-jest | 단위 테스트 (25개, 4 suites) | TypeScript 네이티브 지원. 빠른 실행 |
| Playwright | E2E 테스트 | 크로스 브라우저. Vercel Preview URL 연동 가능 |

---

## 2. 데이터 모델

### 2.1 ideas 테이블 (핵심)

```sql
CREATE TABLE ideas (
  -- 식별/원본 데이터
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  description       text,
  source            text NOT NULL,        -- 'hackernews'|'reddit'|'producthunt'|'github'|'playstore'|'appstore'
  source_url        text,
  score             integer DEFAULT 0,
  comment_count     integer DEFAULT 0,
  collected_at      timestamptz DEFAULT now(),

  -- AI 분석 결과 (Groq llama-3.1-8b-instant)
  summary_ko        text,                 -- 한국어 2-3문장 요약
  market_size       text,                 -- "글로벌 $5B, 국내 500억"
  difficulty        integer,              -- 구현 난이도 1-5
  revenue_potential integer,              -- 수익 잠재력 1-5
  competition       integer,              -- 경쟁 강도 1-5
  recommended_stack text[],               -- ["Next.js", "Supabase", "Stripe"]
  mvp_days          integer,              -- MVP 예상 일수
  tags              text[],               -- ["SaaS", "AI", "B2B"]
  trend_score       float DEFAULT 0,      -- 종합 트렌드 점수

  -- 프롬프트 생성 / 플랫폼 분석
  generated_prompts     jsonb,            -- { default: GeneratedPrompts, appintoss: GeneratedPrompts }
  implementation_status text DEFAULT 'pending',  -- pending|generating|done|error|analyzing
  platform_analysis     jsonb,            -- PlatformAnalysis (ait_score, ait_category, ...)

  -- 원본 데이터
  raw_data          jsonb                 -- 원본 API 응답 데이터
);
```

**인덱스:**
- `ideas(collected_at DESC)` -- 최신순 정렬
- `ideas(trend_score DESC)` -- 트렌딩 정렬
- `ideas(source)` -- 소스별 필터
- `ideas(implementation_status)` -- 상태별 조회
- `ideas(source, collected_at DESC)` -- 소스+날짜 복합

**JSONB 컬럼 구조:**

`generated_prompts`:
```json
{
  "default": {
    "project_name": "my-project",
    "overview": "한국어 프로젝트 설명",
    "master_prompt": "다음 프로젝트를 처음부터 끝까지...",
    "phases": [
      { "step": 1, "title": "프로젝트 초기화", "prompt": "..." },
      { "step": 2, "title": "DB 스키마 & 백엔드", "prompt": "..." },
      { "step": 3, "title": "프론트엔드 UI", "prompt": "..." },
      { "step": 4, "title": "핵심 기능 연결", "prompt": "..." },
      { "step": 5, "title": "테스트 & 배포", "prompt": "..." }
    ],
    "tech_stack": ["Next.js", "Supabase"],
    "free_services": ["Vercel free", "Supabase free", "GitHub free"]
  },
  "appintoss": {
    "project_name": "ait-app",
    "overview": "앱인토스 미니앱: ...",
    "master_prompt": "...",
    "phases": [...],
    "tech_stack": ["React", "Vite", "@apps-in-toss/web-framework", "TDS", "Granite"],
    "free_services": ["토스 앱인토스 플랫폼", "AdMob IAA", "Supabase free"]
  }
}
```

`platform_analysis`:
```json
{
  "ait_score": 85,
  "ait_category": "유틸리티",
  "ait_blocked_reason": null,
  "ait_ad_revenue_estimate": "월 예상 광고수익 300-500만원",
  "ait_target_type": "webview"
}
```

### 2.2 daily_digests 테이블

```sql
CREATE TABLE daily_digests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date           date UNIQUE NOT NULL DEFAULT current_date,  -- 하루 1개만 (UPSERT)
  top_ideas      jsonb NOT NULL,     -- 상위 10개 아이디어 스냅샷 (id, title, summary_ko, trend_score, source, source_url)
  hot_topics     text[],             -- 핫 토픽 키워드 3-5개 (AI 생성)
  market_insights text,              -- 시장 인사이트 요약 2-3문장 (AI 생성)
  generated_at   timestamptz DEFAULT now()
);
```

### 2.3 collect_logs 테이블

```sql
CREATE TABLE collect_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text,              -- 수집기 이름 ('hackernews', 'reddit', ...) 또는 'all' (전체 합계)
  collected_count integer,           -- 수집된 아이디어 수
  error           text,              -- 에러 메시지 (성공 시 null)
  ran_at          timestamptz DEFAULT now()
);
```

### 2.4 TypeScript 타입 정의 (`types/idea.ts`)

```typescript
// 핵심 아이디어 타입
interface Idea {
  id: string;
  title: string;
  description: string | null;
  source: 'hackernews' | 'reddit' | 'producthunt' | 'github' | 'playstore' | 'appstore';
  source_url: string;
  score: number;
  comment_count: number;
  collected_at: string;
  summary_ko: string | null;
  market_size: string | null;
  difficulty: number | null;           // 1-5
  revenue_potential: number | null;    // 1-5
  competition: number | null;          // 1-5
  recommended_stack: string[] | null;
  mvp_days: number | null;
  tags: string[] | null;
  trend_score: number;
  generated_prompts: GeneratedPrompts | { default?: GeneratedPrompts; appintoss?: GeneratedPrompts } | null;
  implementation_status: 'pending' | 'generating' | 'done' | 'error';
  raw_data: Record<string, unknown> | null;
  platform_analysis?: PlatformAnalysis | null;
}

// 앱인토스 플랫폼 분석 결과
interface PlatformAnalysis {
  ait_score: number;                    // 0-100
  ait_category: string;                 // "유틸리티"|"라이프스타일"|"엔터테인먼트"|...
  ait_blocked_reason: string | null;
  ait_ad_revenue_estimate: string;      // "월 예상 광고수익 300-500만원"
  ait_target_type: 'webview' | 'react-native';
}

// 구현 프롬프트
interface GeneratedPrompts {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: { step: number; title: string; prompt: string }[];
  tech_stack: string[];
  free_services: string[];
}

// 앱인토스 전용 프롬프트 (GeneratedPrompts 확장)
interface AitGeneratedPrompts extends GeneratedPrompts {
  platform_type: 'webview' | 'react-native';
  improvement_points: string[];
  marketing_strategy: string;
}

// 일일 다이제스트
interface Digest {
  id: string;
  date: string;
  top_ideas: Idea[];
  hot_topics: string[];
  market_insights: string;
  generated_at: string;
}
```

---

## 3. 수집 파이프라인

### 3.1 전체 수집 흐름

```
[Vercel Cron: 매일 06:00 UTC]
    |
    v
/api/cron/collect (GET + Authorization: Bearer CRON_SECRET)
    |
    +-- verifyCronSecret() [crypto.timingSafeEqual]
    |   실패 시 -> 401 Unauthorized
    |
    v
순차 실행 (7개 수집기):
    +-> collectHackerNews()   --+
    +-> collectReddit()        |
    +-> collectProductHunt()   |  각 소스별 최대 10개 RawIdea
    +-> collectGitHub()        +-> { title, description, source,
    +-> collectPlayStore()     |     source_url, score, comment_count }
    +-> collectAppStore()      |
    +-> collectAppBrain()    --+
                                |
                                v
                    [메가앱 필터링 (isMegaApp)]
                    80+ 대형 앱 패키지 프리픽스 자동 제외
                    (Big Tech, 소셜, 스트리밍, 이커머스, 금융, 게임 등)
                                |
                                v
                    [배치 중복 체크]
                    Supabase: SELECT source_url FROM ideas WHERE source_url IN (...)
                    -> existingUrls Set으로 필터
                                |
                                v
                    [Groq AI 분석 (analyzeIdea)]
                    모델: llama-3.1-8b-instant
                    temperature: 0.3, max_tokens: 500
                    -> summary_ko, market_size, difficulty, revenue_potential,
                       competition, recommended_stack, mvp_days, tags
                    -> 500ms 딜레이 (Groq rate limit 방지)
                                |
                                v
                    [trend_score 계산 (calcTrendScore)]
                    base = score * 0.4 + comments * 0.3
                    potential = (revenue_potential / 5) * 40
                    ease = ((6 - difficulty) / 5) * 30
                    trend_score = round(base * 0.1 + potential + ease)
                                |
                                v
                    [Supabase 배치 INSERT]
                    ideas 테이블에 분석 결과 포함하여 저장
                                |
                                v
                    [collect_logs 기록]
                    소스별: { source, collected_count, error? }
                    전체:   { source: 'all', collected_count: total }
```

### 3.2 수집기별 데이터 소스

| 수집기 | 데이터 소스 | 수집 방식 | 특이사항 |
|--------|------------|-----------|----------|
| HackerNews | `hacker-news.firebaseio.com/v0` | REST API | Top Stories ID 조회 -> 개별 item fetch |
| Reddit | `reddit.com/.json` | Public JSON | 서브레딧 hot 게시물 |
| ProductHunt | ProductHunt API | Bearer 토큰 | `PRODUCTHUNT_API_TOKEN` 환경변수 |
| GitHub | GitHub API | REST API (optional token) | Trending repos. `GITHUB_API_TOKEN`으로 rate limit 완화 |
| PlayStore | Google Play | 스크래핑 | `isMegaApp` 필터 적용 |
| AppStore | Apple RSS | RSS 피드 파싱 | 카테고리별 신규 앱 |
| AppBrain | AppBrain.com | 스크래핑 | Android 앱 트렌드 |

### 3.3 안정성 메커니즘

```typescript
// lib/collectors/utils.ts
collectWithRetry(fn, maxRetries=3, backoffMs=1000)
// 실패 시 1초, 2초, 3초 지수 백오프로 재시도

deduplicateByField(items, field)
// 동일 필드값 기준 중복 제거
```

- **격리**: 하나의 수집기 실패 시 try/catch로 감싸서 나머지 수집기는 정상 동작
- **에러 로깅**: 실패한 수집기는 `collect_logs`에 `error` 필드와 함께 기록
- **배치 중복 체크**: 개별 URL 조회가 아닌 IN 쿼리로 한 번에 중복 확인 (N+1 방지)

---

## 4. AI 파이프라인

### 4.1 아이디어 분석 (`lib/ai/analyzer.ts`)

```
입력: { title: string, description: string }
  |
  v
analyzeIdea() -- Groq llama-3.1-8b-instant
  |  temperature: 0.3
  |  max_tokens: 500
  |  프롬프트: "다음 비즈니스 아이디어를 분석해서 JSON으로만 응답해"
  |
  v
JSON 파싱 + 필수 필드 검증 + 범위 강제
  |  - summary_ko: 없으면 description 앞 100자
  |  - difficulty/revenue_potential/competition: Math.min(5, Math.max(1, value))
  |  - recommended_stack: 배열 아니면 ["Next.js", "Supabase"]
  |  - mvp_days: 없으면 30
  |  - tags: 배열 아니면 ["기타"]
  |
  v (LLM 완전 실패 시)
폴백: 모든 필드에 기본값 적용 (서비스 중단 없음)
```

### 4.2 앱인토스 적합도 분석 (`lib/ai/ait-analyzer.ts`)

```
입력: { title, summary_ko, tags, difficulty, revenue_potential, market_size, recommended_stack }
  |
  v
[1단계] 금지 카테고리 사전 필터링
  |  BLOCKED_CATEGORIES: 금융, 투자, 디지털자산, 암호화폐, 주식 등
  |  -> 해당 시 { ait_score: 0, ait_blocked_reason: "..." }
  |
  v (통과 시)
[2단계] Groq AI 분석 (analyzeAitSuitability)
  |  모델: llama-3.1-8b-instant
  |  평가 기준 가중치:
  |    - 광고수익잠재력 30%
  |    - 사용자참여도 30%
  |    - 구현용이성 20%
  |    - 심사통과가능성 20%
  |
  v
출력: PlatformAnalysis
  {
    ait_score: 0-100,
    ait_category: "유틸리티"|"라이프스타일"|"엔터테인먼트"|"교육"|"건강"|"소셜"|"게임"|"생산성",
    ait_blocked_reason: null | "차단 사유",
    ait_ad_revenue_estimate: "월 예상 광고수익 ...",
    ait_target_type: "webview" | "react-native"
  }
```

### 4.3 프롬프트 생성 (`lib/ai/prompt-generator.ts`)

**기본 프롬프트 생성 (default):**
```
입력: Idea 객체
  |
  v
generateTechDetails() -- Groq llama-3.3-70b-versatile
  |  temperature: 0.4, max_tokens: 1000
  |  "Generate technical details for this web app in Korean"
  |  -> { db_schema, api_endpoints, ui_screens, core_features }
  |
  |  실패 시 -> buildFallbackDetails()
  |             (users/items/categories 테이블, CRUD API, 기본 화면)
  |
  v
템플릿 조립:
  마스터 프롬프트 = [프로젝트 개요] + [기술 스택] + [DB 스키마]
                  + [API 설계] + [UI 화면] + [핵심 기능] + [구현 규칙]
  구현 규칙: "유료 서비스 절대 사용 금지", "TypeScript strict",
             "Jest + Playwright 테스트", "Vercel 배포" 등

  단계별 프롬프트 = 5단계:
    1. 프로젝트 초기화 (Next.js, TypeScript, Tailwind, Git)
    2. DB 스키마 & 백엔드 (Supabase 테이블, API 라우트)
    3. 프론트엔드 UI (페이지, 컴포넌트, 반응형, 다크모드)
    4. 핵심 기능 연결 (비즈니스 로직, Supabase Auth, Realtime)
    5. 테스트 & 배포 (Jest, Playwright, vercel.json, README)
```

**앱인토스 프롬프트 생성 (appintoss):**
```
조건: platform === 'appintoss' && idea.platform_analysis 존재
  |
  v
formatAitPrompt() [lib/prompt-formatter.ts]
  |  앱인토스 특화 마스터 프롬프트 생성:
  |    - TDS(토스 디자인 시스템) 필수 사용
  |    - Granite 빌드 도구
  |    - AdMob IAA SDK 통합
  |    - 심사 체크리스트 (운영/디자인/기능/보안)
  |
  v
tech_stack 결정 (ait_target_type 기반):
  webview:       ["React", "Vite", "@apps-in-toss/web-framework", "TDS", "Granite"]
  react-native:  ["React Native", "@apps-in-toss/framework", "TDS", "Granite"]

5단계 전용 프롬프트:
  1. Granite 프로젝트 초기화 (npm create granite-app, granite.config.ts)
  2. TDS UI 구축 (NavigationBar, Button, Input 등)
  3. 핵심 기능 구현 (비즈니스 로직 + API + 상태 관리)
  4. 광고 SDK 통합 (AdMob IAA SDK + 배치 최적화)
  5. 빌드 & 심사 준비 (granite build -> .ait -> 체크리스트)
```

### 4.4 다이제스트 AI 분석 (`/api/cron/digest`)

```
입력: 최근 24시간 TOP 10 아이디어 목록
  |
  v
Groq llama-3.1-8b-instant
  |  temperature: 0.3, max_tokens: 500
  |  "다음 비즈니스 아이디어 목록을 분석해서 JSON으로만 응답해"
  |
  v
출력:
  hot_topics: ["트렌드1", "트렌드2", ...] (3-5개 핵심 키워드)
  market_insights: "시장 트렌드 분석 (2-3문장)"
```

---

## 5. 프롬프트 생성 아키텍처

### 5.1 설계 철학: 템플릿 기반 + LLM 기술 상세

IdeaHunter의 프롬프트 생성은 **LLM에 전체 프롬프트 생성을 맡기지 않는다**. 대신:

1. **코드 템플릿이 구조를 보장**: 프롬프트의 한국어 구조, 섹션 순서, 구현 규칙은 TypeScript 코드로 하드코딩
2. **LLM은 기술 상세만 생성**: DB 스키마, API 엔드포인트, UI 화면, 핵심 기능의 구체적 내용만 LLM이 아이디어에 맞게 생성
3. **폴백 기본값 보장**: LLM 실패 시에도 일반적인 웹앱 구조(users/items/categories)로 프롬프트 생성 가능

이 설계의 장점:
- 프롬프트 품질의 일관성 보장 (LLM 할루시네이션으로 구조가 깨지지 않음)
- 한국어 프롬프트 품질 보장 (영어 LLM이 한국어 구조를 잘못 생성하는 문제 방지)
- "유료 서비스 금지" 같은 규칙이 LLM에 의해 무시되지 않음

### 5.2 AI 프로바이더 폴백 체인

```
사용자: "프로젝트 생성하기" 클릭
  |
  v
[1순위] 로컬 브릿지 서버 (bridge/server.ts, port 3100)
  |
  |  Health Check: GET /health (3초 타임아웃)
  |    -> { status: 'ok', providers: [{ name, available }] }
  |    -> CLI 감지 결과 60초 캐싱
  |
  |  생성 요청: POST /generate (90초 타임아웃)
  |    -> generateWithFallback(request)
  |       +-- Claude Code CLI 시도 (최우선)
  |       +-- Codex CLI 폴백
  |    -> { provider: 'claude-code' | 'codex', ...prompts }
  |
  |  실패 시 (서버 미실행, CLI 없음, 생성 실패) |
  v
[2순위] 서버 API (Groq Cloud)
  |
  |  POST /api/ideas/[id]/generate-prompts
  |    -> generateTechDetails(): llama-3.3-70b-versatile
  |    -> 템플릿 기반 마스터 프롬프트 조립
  |
  |  실패 시 |
  v
[3순위] 폴백 기본값 (buildFallbackDetails)
  |  하드코딩된 일반 웹앱 구조
  |  -> users, items, categories 테이블
  |  -> CRUD API + 기본 화면
```

### 5.3 브릿지 서버 구조 (`bridge/`)

```
bridge/
  server.ts             -- HTTP 서버 (node:http, port 3100)
  types.ts              -- GenerateRequest, GenerateResult, ProviderStatus
  prompt-builder.ts     -- 프롬프트 빌더
  providers/
    index.ts            -- generateWithFallback(), detectAvailableProviders()
    claude-code.ts      -- detectClaudeCode(), generateWithClaudeCode()
    codex-cli.ts        -- detectCodex(), generateWithCodex()
```

**브릿지 서버 보안:**
- CORS: `BRIDGE_ALLOWED_ORIGIN` (기본 `http://localhost:3000`)
- 바디 크기 제한: 1MB (`MAX_BODY_BYTES`)
- 127.0.0.1에만 바인딩 (외부 접근 차단)

---

## 6. 배포 전략

### 6.1 배포 구성

```
+--------------+     +------------------+     +------------------+
| GitHub Repo   |---->| GitHub Actions   |---->| Vercel           |
| (소스 코드)    |     | ci.yml: 테스트     |     | (프로덕션 배포)    |
|               |     | deploy.yml: 배포   |     |                  |
+--------------+     +------------------+     +------------------+
                                                       |
                                                       v
                                               +------------------+
                                               | Vercel Cron      |
                                               | 0 6 * * *        |
                                               | -> /api/cron/    |
                                               |    collect       |
                                               +------------------+
```

### 6.2 Vercel 크론 설정 (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/cron/collect", "schedule": "0 6 * * *" }
  ]
}
```

- Vercel Hobby 플랜: 일 1회 크론 (매일 06:00 UTC = 한국시간 15:00)
- 다이제스트 생성은 수집 완료 후 별도 호출 또는 수집 API 내부에서 체인

### 6.3 환경 변수

| 변수 | 위치 | 필수 | 용도 |
|------|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | .env.local + Vercel | Yes | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local + Vercel | Yes | Supabase 공개 API 키 (읽기용) |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local + Vercel | Yes | Supabase 관리자 키 (쓰기, 서버 전용) |
| `GROQ_API_KEY` | .env.local + Vercel | Yes | Groq LLM API 키 |
| `CRON_SECRET` | .env.local + Vercel | Yes | 크론 엔드포인트 인증 |
| `API_SECRET` | .env.local + Vercel | Prod | 프롬프트 생성 API 인증 |
| `PRODUCTHUNT_API_TOKEN` | .env.local + Vercel | No | ProductHunt Bearer 토큰 |
| `GITHUB_API_TOKEN` | .env.local + Vercel | No | GitHub API rate limit 완화 |
| `BRIDGE_PORT` | .env.local | No | 브릿지 서버 포트 (기본 3100) |
| `BRIDGE_ALLOWED_ORIGIN` | .env.local | No | 브릿지 CORS (기본 localhost:3000) |

### 6.4 CI/CD 파이프라인

```
Push/PR -> ci.yml:
  1. npm ci (의존성 설치)
  2. npm run lint (ESLint)
  3. npm run test (Jest 25개 테스트)
  4. npx tsc --noEmit (타입 체크)
  5. npm run build (빌드 검증)

Merge to main -> deploy.yml:
  1. Vercel CLI로 프로덕션 배포
  2. 배포 URL 확인
```

---

## 7. 보안 아키텍처

### 7.1 현재 구현된 보안 조치

| 영역 | 구현 내용 | 파일 |
|------|-----------|------|
| CRON 인증 | `crypto.timingSafeEqual()` 기반 타이밍 공격 방지 | `lib/auth.ts` |
| UUID 검증 | `/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i` 정규식 검증 | `api/ideas/[id]/*/route.ts` |
| API 입력 검증 | sort/source `ALLOWED_*` Set 화이트리스트, tag 정규식 `[\w\s-]{1,50}`, limit 최대 50 | `api/ideas/route.ts` |
| 원자적 잠금 | `implementation_status` 필드로 동시 생성/분석 방지 (`.neq('implementation_status', 'generating')`) | `generate-prompts`, `analyze-ait` |
| RLS | Supabase Row Level Security: 공개 읽기, service_role만 쓰기 | Supabase Dashboard |
| 보안 헤더 | X-Frame-Options, X-Content-Type-Options, CSP 등 | `next.config.ts` |
| 브릿지 CORS | `BRIDGE_ALLOWED_ORIGIN` 제한 (기본 localhost:3000) | `bridge/server.ts` |
| 바디 크기 제한 | 브릿지 서버 1MB 최대 바디 | `bridge/server.ts` |
| CDN 캐시 | `s-maxage=300, stale-while-revalidate` 5분 CDN 캐시 | `api/ideas/route.ts` |

### 7.2 향후 보안 강화 계획

| 영역 | 필요 내용 | 우선순위 |
|------|-----------|----------|
| Rate Limiting | Vercel Edge 미들웨어 기반 IP별 요청 제한 | P1 |
| Supabase Auth | 사용자 인증 + 개인 데이터 보호 | P1 |
| 에러 모니터링 | Sentry로 프로덕션 보안 이벤트 추적 | P1 |
| 콘텐츠 검증 | 수집 데이터 XSS 방지 (sanitize) | P2 |
| API 키 로테이션 | 정기적 환경변수 키 교체 | P2 |

---

## 8. 확장 계획

### 8.1 데이터 규모 추정

| 항목 | 현재 | 6개월 후 | 12개월 후 |
|------|------|----------|-----------|
| 일 수집량 | ~70개 (7소스 x 10개) | ~70개 | ~100개 (소스 추가 시) |
| 누적 아이디어 | ~2,100개 | ~12,600개 | ~36,500개 |
| DB 용량 | ~10MB | ~60MB | ~180MB |
| Supabase Free 한도 | 500MB | 충분 | 충분 (JSONB 압축 시) |

### 8.2 확장 병목 및 대응

| 병목 | 현재 상태 | 대응 방안 |
|------|-----------|-----------|
| Groq API rate limit | 500ms 딜레이 적용 | 배치 사이즈 조절 + 큐 시스템 |
| Vercel Cron 제한 | Hobby: 1일 1회 | Pro ($20/월) 또는 외부 cron (cron-job.org) |
| Supabase Free DB | 500MB | 오래된 raw_data 필드 정리. 12개월 후 Pro 검토 |
| 수집기 안정성 | PlayStore/AppBrain 스크래핑 의존 | API 전환 또는 RSS 폴백 추가 |

### 8.3 아키텍처 진화 방향

```
현재 (v0.4):
  모놀리식 Next.js + Vercel Cron + Groq
  +-- 로컬 브릿지 서버 (선택적)
  +-- 앱인토스 분석기

단기 (v1.0):
  + Supabase Auth (사용자 관리)
  + Vercel Edge Middleware (Rate Limiting)
  + Sentry (에러 모니터링)
  + Playwright E2E 테스트

중기 (v1.5):
  + 큐 시스템 (대량 수집 시)
  + Supabase Realtime (실시간 알림)
  + Resend (이메일 다이제스트)
  + Slack/Discord 웹훅 알림

장기 (v2.0):
  + 사용자별 맞춤 큐레이션 (ML 기반)
  + API 공개 (외부 개발자)
  + QMD 인덱싱 (Quick Metadata)
  + 다국어 지원 (영어/일본어)
```
