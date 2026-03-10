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

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (공개) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (서버 전용) |
| `GROQ_API_KEY` | Yes | [Groq Console](https://console.groq.com) API key |
| `CRON_SECRET` | Yes | Cron 인증용 랜덤 문자열 (`openssl rand -hex 32`) |
| `API_SECRET` | Prod | 공개 API 엔드포인트 보호용 시크릿 (미설정 시 인증 스킵) |
| `PRODUCTHUNT_API_TOKEN` | No | [ProductHunt API](https://www.producthunt.com/v2/oauth/applications) token |
| `GITHUB_API_TOKEN` | No | GitHub Personal Access Token (미설정 시 60req/hr 제한) |

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

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ideas?sort=trend_score&source=reddit&tag=AI&limit=20&page=0` | - | 아이디어 목록 |
| GET | `/api/digest` | - | 오늘의 다이제스트 |
| POST | `/api/ideas/[id]/generate-prompts` | API_SECRET | Claude Code 프롬프트 생성 |
| GET | `/api/cron/collect` | CRON_SECRET | 아이디어 수집 (cron) |
| GET | `/api/cron/digest` | CRON_SECRET | 다이제스트 생성 (cron) |

### ideas API 파라미터

| Param | Values | Default |
|-------|--------|---------|
| `sort` | `trend_score`, `latest` | `trend_score` |
| `source` | `hackernews`, `reddit`, `producthunt`, `github` | all |
| `tag` | 영숫자/하이픈 (최대 50자) | all |
| `limit` | 1-50 | 20 |
| `page` | 0-100 | 0 |

## Data Sources

- **HackerNews** - Algolia API (Show HN, Ask HN 등)
- **Reddit** - r/SideProject, r/startups, r/entrepreneur 등
- **ProductHunt** - GraphQL API v2 (상위 20개 제품, Bearer 인증)
- **GitHub** - 트렌딩 저장소 (saas-boilerplate, ai-tools 등, 토큰 지원)

## Security

- CRON 엔드포인트: `crypto.timingSafeEqual()` 기반 Bearer 인증
- generate-prompts API: `API_SECRET` 기반 인증 (x-api-key 또는 Bearer)
- 입력 검증: sort/source 화이트리스트, tag 형식 검증
- 보안 헤더: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- DB: Supabase RLS (공개 읽기, service_role만 쓰기)

## Deployment

### Vercel (권장)

1. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
2. **Root Directory**: `ideahunter` 로 설정
3. Environment Variables에 위 환경변수 모두 입력
4. 배포 후 `vercel.json`의 cron이 자동 활성화

### CI/CD (GitHub Actions)

- **CI** (`ci.yml`): PR/main push 시 TypeScript 체크 + Jest 테스트
- **Deploy** (`deploy.yml`): main push 시 Vercel 프로덕션 배포

GitHub Secrets 필요:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel > Settings > Tokens에서 생성 |
| `VERCEL_ORG_ID` | `vercel link` 실행 후 `.vercel/project.json`에서 확인 |
| `VERCEL_PROJECT_ID` | 위와 동일 |

### 수동 Cron 테스트

```bash
# 아이디어 수집
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/collect

# 다이제스트 생성
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/digest
```
