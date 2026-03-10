# PROJECT_FOUNDATION.md

## 개요
- 프로젝트명: IdeaHunter
- 한 줄 설명: AI 기반 비즈니스 아이디어 자동 큐레이션 + Claude Code 프롬프트 생성 시스템
- 핵심 사용자: 한국 인디 개발자, 사이드 프로젝트 빌더
- 핵심 목표: 트렌딩 아이디어 발견 -> 분석 -> 실행 가능한 프롬프트 자동 생성
- 현재 기준 문서:
  - docs/MASTER_BLUEPRINT_PART1.md
  - api-spec.yaml
  - docs/analytics-events.md
  - docs/launch-checklist.md
  - docs/screen-matrix.md

## 현재 제품 정의 요약
7개 소스(HackerNews, Reddit, ProductHunt, GitHub, PlayStore, AppStore, AppBrain)에서 트렌딩 아이디어를 자동 수집하고, Groq LLM(llama-3.1-8b-instant)으로 한국어 요약/시장분석/난이도 평가를 수행한다. 분석된 아이디어에 대해 Claude Code 구현 프롬프트(한국어, 템플릿 기반)를 자동 생성하며, Apps-in-Toss(앱인토스) 플랫폼 적합성 분석 및 전용 프롬프트도 지원한다. 스택은 Next.js 16 (App Router) + React 19 + Supabase + Groq SDK이며 Vercel Hobby에 배포한다.

## 현재 핵심 사용자 흐름 요약
1. **아이디어 탐색**: 메인 피드(/)에서 트렌드 점수순/최신순으로 아이디어 카드 브라우징. 소스/태그 필터 적용.
2. **상세 분석 확인**: IdeaCard에서 AI 분석 결과(난이도, 수익성, 경쟁도, 추천 스택, MVP 소요일) 확인.
3. **프롬프트 생성 및 복사**: "프롬프트 생성" 클릭 -> ImplementationModal에서 마스터 프롬프트/단계별 프롬프트 확인 -> 클립보드 복사 -> Claude Code에서 바로 실행.
4. **앱인토스 분석**: "앱인토스 분석" 클릭 -> 토스 미니앱 적합성 점수/카테고리/구현 타입 확인 -> 앱인토스 전용 프롬프트 생성.
5. **다이제스트 확인**: /digest에서 오늘의 TOP 10 아이디어 순위 확인.

## 현재 launch-critical 경로 요약
- **인프라**: Vercel 배포, Supabase 스키마, 환경변수 5종(SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, GROQ_API_KEY, CRON_SECRET), Cron 스케줄
- **데이터 파이프라인**: 7개 수집기 동작, AI 분석 정상 응답, trend_score 계산, collect_logs 기록
- **핵심 API**: GET /api/ideas, GET /api/cron/collect, POST /api/ideas/{id}/generate-prompts, POST /api/ideas/{id}/analyze-ait, GET /api/digest
- **보안**: RLS 활성화, CRON_SECRET 인증, UUID/입력 검증
- **성능**: next build 성공, Cache-Control 적용 (ideas 300s, digest 3600s)

## 운영 참고
- 이 문서는 foundation 문서들의 짧은 index/요약본이다
- 상세 기준은 원본 문서를 우선한다
