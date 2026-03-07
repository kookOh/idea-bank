# IdeaHunter Roadmap

> Last updated: 2026-03-07

## Completed

### v0.1 — Core (feat: implement IdeaHunter)
- [x] Next.js 16 App Router 프로젝트 셋업
- [x] Supabase 스키마 설계 (ideas, daily_digests, collect_logs)
- [x] 데이터 수집기 4종 (HackerNews, Reddit, ProductHunt, GitHub)
- [x] Groq AI 분석 (요약, 난이도, 수익성, 태그, MVP 예상)
- [x] trend_score 계산 알고리즘
- [x] 메인 피드 UI (필터, 정렬, 무한 스크롤)
- [x] 다이제스트 페이지 (오늘의 TOP 10)
- [x] Claude Code 프롬프트 자동 생성 (ImplementationModal)
- [x] Vercel Cron 설정 (6시간마다 수집/다이제스트)

### v0.2 — Code Review & Hardening
- [x] ProductHunt Bearer 인증 헤더
- [x] daily_digests cron 생성 로직 (`/api/cron/digest`)
- [x] 수집기 에러 처리 보강 (try-catch, res.ok 체크)
- [x] IdeaCard null 안전성 (Number() || 0)
- [x] prompt-generator 응답 검증 (필드별 기본값)
- [x] generate-prompts 중복 요청 방지 (429)
- [x] digest 페이지 에러 상태 UI + 재시도
- [x] 테스트 추가 (ai-analyzer, prompt-generator, collectors)
- [x] CI/CD 파이프라인 (ci.yml, deploy.yml)

### v0.3 — Security & Type Safety
- [x] `crypto.timingSafeEqual()` 기반 CRON 인증 (`lib/auth.ts`)
- [x] generate-prompts API 인증 (`API_SECRET`)
- [x] generate-prompts 레이스 컨디션 → 원자적 DB 잠금
- [x] GitHub 수집기 API 토큰 지원 (`GITHUB_API_TOKEN`)
- [x] ideas API 입력 검증 (sort/source 화이트리스트, tag 형식, limit 최대값)
- [x] `any` 타입 6곳 제거 → `types/idea.ts` 공통 타입 정의
- [x] DigestBanner 에러 처리 (조용한 실패 제거)
- [x] 접근성(a11y) 개선 (aria-label)
- [x] DB 인덱스 추가 (implementation_status, source+collected_at)
- [x] Next.js 보안 헤더 (X-Frame-Options 등)
- [x] auth 유틸 테스트 추가 (25개 전체 통과)
- [x] CI/CD working-directory 수정 (모노레포 구조)
- [x] 문서 동기화 (.env.example, README.md)
- [x] 수집기별 성공 로그 기록

---

## Current Status

- **Branch**: `claude/ideahunter-curator-0v6S8`
- **Tests**: 25 passed (4 suites)
- **Build**: Next.js 16.1.6 성공
- **TypeScript**: noEmit 통과 (0 errors)

---

## Backlog (우선순위순)

### Next Sprint
- [ ] Supabase Auth 연동 (사용자별 즐겨찾기/알림)
- [ ] rate limiting 미들웨어 (Vercel Edge)
- [ ] E2E 테스트 (Playwright)
- [ ] 에러 모니터링 (Sentry 연동)

### Future
- [ ] 이메일 다이제스트 발송 (Resend)
- [ ] Slack/Discord 웹훅 알림
- [ ] 커스텀 키워드 트래킹
- [ ] 다국어 분석 (영어 요약 추가)
- [ ] 아이디어 비교 기능
- [ ] PWA 지원 (오프라인 캐시)
- [ ] 대시보드 (수집 통계 차트)

---

## Architecture

```
ideahunter/
├── app/
│   ├── page.tsx                    # 메인 피드
│   ├── digest/page.tsx             # 다이제스트 페이지
│   └── api/
│       ├── ideas/route.ts          # 아이디어 목록 API
│       ├── ideas/[id]/generate-prompts/route.ts  # 프롬프트 생성
│       ├── digest/route.ts         # 다이제스트 조회
│       └── cron/
│           ├── collect/route.ts    # 아이디어 수집 (cron)
│           └── digest/route.ts     # 다이제스트 생성 (cron)
├── components/
│   ├── IdeaCard.tsx
│   ├── ImplementationModal.tsx
│   ├── FilterBar.tsx
│   └── DigestBanner.tsx
├── lib/
│   ├── auth.ts                     # 인증 유틸 (timingSafeEqual)
│   ├── supabase.ts
│   ├── fetch-utils.ts
│   ├── ai/
│   │   ├── analyzer.ts             # Groq AI 분석
│   │   └── prompt-generator.ts     # Claude Code 프롬프트 생성
│   └── collectors/
│       ├── index.ts
│       ├── hackernews.ts
│       ├── reddit.ts
│       ├── producthunt.ts
│       └── github.ts
├── types/idea.ts                   # 공통 타입 정의
├── tests/                          # Jest 단위 테스트 (25개)
├── supabase/schema.sql             # DB 스키마
├── vercel.json                     # Cron 설정
└── .github/workflows/              # CI/CD
    ├── ci.yml
    └── deploy.yml
```

## Environment Variables

| Variable | Where | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | .env.local + Vercel | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | .env.local + Vercel | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | .env.local + Vercel | Yes |
| `GROQ_API_KEY` | .env.local + Vercel | Yes |
| `CRON_SECRET` | .env.local + Vercel | Yes |
| `API_SECRET` | .env.local + Vercel | Prod |
| `PRODUCTHUNT_API_TOKEN` | .env.local + Vercel | No |
| `GITHUB_API_TOKEN` | .env.local + Vercel | No |
| `VERCEL_TOKEN` | GitHub Secrets only | Deploy |
| `VERCEL_ORG_ID` | GitHub Secrets only | Deploy |
| `VERCEL_PROJECT_ID` | GitHub Secrets only | Deploy |
