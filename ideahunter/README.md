# IdeaHunter - AI Business Idea Curator

HackerNews, Reddit, ProductHunt, GitHub에서 비즈니스 아이디어를 자동 수집하고 AI로 분석하여 트렌드 점수를 매기는 큐레이션 플랫폼.

## Architecture

```
Next.js 16 (App Router)
├── Vercel Cron → /api/cron/collect (6시간마다 아이디어 수집)
│                 /api/cron/digest  (6시간마다 다이제스트 생성)
├── Groq AI    → 아이디어 분석 + 프롬프트 생성 (Llama 3)
├── Supabase   → PostgreSQL DB + RLS
└── Vercel     → 배포 + Serverless Functions
```

## Setup

### 1. Install dependencies

```bash
cd ideahunter
npm install
```

### 2. Supabase setup

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Settings > API에서 URL, anon key, service role key 복사

### 3. Environment variables

```bash
cp .env.example .env.local
```

`.env.local`에 실제 값 입력:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (공개) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (서버 전용) |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com) API key |
| `PRODUCTHUNT_API_TOKEN` | [ProductHunt API](https://www.producthunt.com/v2/oauth/applications) token |
| `CRON_SECRET` | Cron 인증용 랜덤 문자열 |

### 4. Run development server

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 실행 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | Jest 단위 테스트 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run test:all` | 전체 테스트 실행 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ideas` | 아이디어 목록 (정렬/필터/페이지네이션) |
| GET | `/api/digest` | 오늘의 다이제스트 |
| POST | `/api/ideas/[id]/generate-prompts` | Claude Code 프롬프트 생성 |
| GET | `/api/cron/collect` | 아이디어 수집 (cron, Bearer auth) |
| GET | `/api/cron/digest` | 다이제스트 생성 (cron, Bearer auth) |

## Data Sources

- **HackerNews** - Algolia API (Show HN, Ask HN 등)
- **Reddit** - r/SideProject, r/startups, r/entrepreneur 등
- **ProductHunt** - GraphQL API v2 (상위 20개 제품)
- **GitHub** - 트렌딩 저장소 (saas-boilerplate, ai-tools 등)

## Deployment

Vercel에 배포 시 `vercel.json`의 cron 설정이 자동 활성화됩니다.
환경변수는 Vercel Dashboard > Settings > Environment Variables에서 설정하세요.
