# IdeaHunter - 제품 요구사항 명세서 (PRD)

> 최종 업데이트: 2026-03-10
> 버전: v0.4 (Foundation Pack)

---

## 1. 기능 요구사항 (Functional Requirements)

### FR-001: 멀티소스 아이디어 수집

- **설명**: HackerNews, Reddit, ProductHunt, GitHub, PlayStore, AppStore, AppBrain 7개 소스에서 트렌딩 비즈니스 아이디어를 자동 수집한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준 (Acceptance Criteria)**:
  - 각 소스별 최대 10개 아이디어를 수집한다
  - 수집된 아이디어는 `title`, `description`, `source`, `source_url`, `score`, `comment_count` 필드를 포함한다
  - 이미 수집된 아이디어(동일 `source_url`)는 배치 IN 쿼리로 중복 체크 후 삽입하지 않는다
  - 각 수집기의 성공/실패 결과가 `collect_logs` 테이블에 기록된다
  - 하나의 수집기가 실패해도 나머지 수집기는 정상 동작한다 (try/catch 격리)
  - `collectWithRetry` 래퍼로 최대 3회 재시도, 지수 백오프 (1초, 2초, 3초)
  - PlayStore/AppBrain 수집 시 메가앱 필터(`isMegaApp`)가 적용된다

### FR-002: 메가앱 필터링

- **설명**: Big Tech, 대형 소셜/스트리밍/이커머스/금융/게임 앱을 수집 대상에서 자동 제외한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준**:
  - `MEGA_APP_PREFIXES` 목록(80+ 패키지 프리픽스)에 해당하는 앱이 필터링된다
  - Big Tech(Google, Apple, Meta, Microsoft, Amazon, Samsung, Huawei) 앱이 제외된다
  - 소셜/메신저, 스트리밍/엔터, 이커머스/결제, 배달/모빌리티, 금융/핀테크, 게임 대형 앱이 제외된다
  - 동아시아 대형(Kakao, Naver, Tencent, ByteDance 등)이 제외된다
  - 필터링은 패키지 ID의 prefix 매칭(`startsWith`)으로 수행된다

### FR-003: AI 아이디어 분석

- **설명**: Groq LLM(`llama-3.1-8b-instant`)을 사용하여 수집된 각 아이디어를 한국어로 분석한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준**:
  - 한국어 2-3문장 핵심 요약(`summary_ko`)이 생성된다
  - 시장 규모 추정(`market_size`, 예: "글로벌 $5B, 국내 500억")이 생성된다
  - 구현 난이도(`difficulty`, 1-5)가 평가된다
  - 수익 잠재력(`revenue_potential`, 1-5)이 평가된다
  - 경쟁 강도(`competition`, 1-5)가 평가된다
  - 추천 기술 스택(`recommended_stack`, 배열)이 제안된다
  - MVP 예상 일수(`mvp_days`, 정수)가 추정된다
  - 카테고리 태그(`tags`, 배열)가 부여된다
  - LLM 응답 실패 시 기본값이 사용된다 (서비스 중단 없음)
  - 모든 수치 필드는 `Math.min(5, Math.max(1, value))`로 유효 범위 내 강제된다

### FR-004: 트렌드 점수 계산

- **설명**: 원본 점수, 댓글 수, AI 분석 결과를 조합하여 종합 트렌드 점수를 계산한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준**:
  - `trend_score = round(base * 0.1 + potential + ease)` 공식이 적용된다
  - `base = score * 0.4 + comment_count * 0.3`
  - `potential = (revenue_potential / 5) * 40`
  - `ease = ((6 - difficulty) / 5) * 30`
  - 결과값은 `Math.round()`로 정수 반올림된다

### FR-005: 프롬프트 생성

- **설명**: 아이디어를 실제 프로젝트로 구현하기 위한 Claude Code 마스터 프롬프트와 5단계 프롬프트를 자동 생성한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준**:
  - `POST /api/ideas/[id]/generate-prompts`로 프롬프트 생성을 요청할 수 있다
  - UUID 형식 검증이 적용된다 (`/^[0-9a-f]{8}-...-[0-9a-f]{12}$/i`)
  - 마스터 프롬프트에 프로젝트 개요, 기술 스택, DB 스키마, API 설계, UI 화면, 핵심 기능, 구현 규칙이 포함된다
  - 5단계 세부 프롬프트가 생성된다 (초기화 -> DB/백엔드 -> 프론트 -> 기능 -> 테스트/배포)
  - "유료 서비스 절대 사용 금지" 규칙이 프롬프트에 포함된다
  - LLM(`llama-3.3-70b-versatile`)이 아이디어 맞춤 기술 상세를 생성한다
  - LLM 실패 시 `buildFallbackDetails`로 일반 웹앱 구조가 제공된다
  - 프롬프트 구조(한국어)는 코드 템플릿이 보장한다 (LLM은 기술 상세만 담당)
  - `generated_prompts` JSONB 컬럼에 `{ default, appintoss }` 구조로 캐싱된다
  - 이미 생성된 프롬프트가 있으면 캐시에서 즉시 반환된다
  - `force=true` 파라미터로 캐시를 무시하고 재생성할 수 있다
  - 원자적 잠금: `implementation_status`를 `generating`으로 설정하여 동시 요청 방지 (429 응답)
  - 사용된 무료 서비스 목록(`free_services`)이 포함된다

### FR-006: 필터 및 정렬

- **설명**: 피드의 아이디어를 소스, 태그, 정렬 기준으로 필터링/정렬한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준**:
  - 정렬: 트렌딩(`trend_score`), 최신(`collected_at`), 앱인토스(`ait_score`) 3가지 제공
  - 정렬 값은 `ALLOWED_SORTS` Set으로 화이트리스트 검증된다
  - 소스 필터: hackernews, reddit, producthunt, github, playstore, appstore 선택 가능
  - 소스 값은 `ALLOWED_SOURCES` Set으로 화이트리스트 검증된다
  - 태그 필터: `/^[\w\s-]{1,50}$/` 정규식으로 형식 검증된다
  - 앱인토스 적합 필터: 클라이언트에서 `ait_score >= 70` 아이디어만 표시하는 토글
  - 페이지네이션: `page` (0-100), `limit` (1-50, 기본 20)
  - `ait_score` 정렬은 JSONB 필드이므로 서버 측 JS 정렬 처리
  - 필터 변경 시 `page`가 0으로 리셋된다
  - `summary_ko IS NOT NULL` 조건으로 분석 완료된 아이디어만 표시된다
  - 유효하지 않은 source 시 400 에러, 유효하지 않은 tag 시 400 에러

### FR-007: 대시보드 피드

- **설명**: 수집/분석된 아이디어를 카드 형태로 표시하는 메인 피드 페이지를 제공한다.
- **우선순위**: Must
- **현재 상태**: 구현 완료
- **수용 기준**:
  - 각 아이디어가 IdeaCard 컴포넌트로 표시된다
  - 카드에 소스 아이콘, score, comment_count, trend_score가 표시된다
  - 카드에 summary_ko, revenue_potential/difficulty (별점), mvp_days가 표시된다
  - 카드에 tags와 recommended_stack이 뱃지로 표시된다
  - "더 보기" 버튼으로 다음 페이지를 로드한다 (페이지네이션)
  - 로딩 상태 ("로딩 중..."), 에러 상태 ("다시 시도" 버튼), 빈 상태 (안내 메시지)가 적절히 표시된다
  - 헤더에 피드(/), 오늘의 TOP 10(/digest), 앱인토스(/ait) 네비게이션이 있다
  - DigestBanner 컴포넌트가 피드 상단에 표시된다

### FR-008: 다이제스트

- **설명**: 오늘의 TOP 10 아이디어를 자동 생성하고 전용 페이지에서 표시한다.
- **우선순위**: Should
- **현재 상태**: 구현 완료
- **수용 기준**:
  - `/api/cron/digest`로 다이제스트를 생성할 수 있다 (CRON_SECRET 인증)
  - 최근 24시간 아이디어에서 `trend_score` 상위 10개를 선별한다
  - 아이디어가 3개 미만이면 다이제스트를 생성하지 않는다
  - Groq(`llama-3.1-8b-instant`)로 `hot_topics`(3-5개 키워드)과 `market_insights`(2-3문장)를 생성한다
  - `daily_digests` 테이블에 UPSERT된다 (`date` UNIQUE 제약, `onConflict: 'date'`)
  - `/digest` 페이지에서 순위(#1-#10)와 함께 표시된다
  - DigestBanner: 메인 피드 상단에 1위 아이디어 제목 + 총 개수 표시, 클릭 시 `/digest` 이동

### FR-009: 앱인토스 적합도 분석

- **설명**: 아이디어의 토스 앱인토스(Apps-in-Toss) 플랫폼 적합성을 AI로 분석한다.
- **우선순위**: Should
- **현재 상태**: 구현 완료
- **수용 기준**:
  - `POST /api/ideas/[id]/analyze-ait`로 분석을 요청할 수 있다
  - UUID 형식 검증이 적용된다
  - 이미 분석된 경우 `platform_analysis` 캐시에서 즉시 반환된다
  - 금지 카테고리(금융/투자/디지털자산/암호화폐/주식 등)가 사전 필터링된다
  - `ait_score`(0-100)가 계산된다 (광고수익 30% + 참여도 30% + 구현용이성 20% + 심사통과 20%)
  - 앱인토스 카테고리(유틸리티/라이프스타일/엔터테인먼트/교육/건강/소셜/게임/생산성)가 분류된다
  - 광고 수익 추정치(`ait_ad_revenue_estimate`)가 제공된다
  - 구현 대상 타입(`ait_target_type`: webview/react-native)이 결정된다
  - 차단 사유(`ait_blocked_reason`)가 있으면 기록된다
  - 원자적 잠금: `implementation_status = 'analyzing'`으로 동시 분석 방지 (429 응답)
  - 분석 완료 후 `implementation_status`는 `null`로 복원된다

### FR-010: 앱인토스 전용 프롬프트 생성

- **설명**: 앱인토스 적합 아이디어에 대해 TDS/Granite 기반 전용 구현 프롬프트를 생성한다.
- **우선순위**: Should
- **현재 상태**: 구현 완료
- **수용 기준**:
  - `POST /api/ideas/[id]/generate-prompts?platform=appintoss`로 요청한다
  - `platform_analysis`가 존재해야 한다 (사전에 AIT 분석 완료 필요)
  - 프롬프트에 TDS(토스 디자인 시스템) 사용이 명시된다
  - 프롬프트에 Granite 빌드 도구가 명시된다
  - 프롬프트에 AdMob IAA SDK 통합이 포함된다
  - `ait_target_type`에 따라 tech_stack이 결정된다:
    - webview: React, Vite, @apps-in-toss/web-framework, TDS, Granite
    - react-native: React Native, @apps-in-toss/framework, TDS, Granite
  - 5단계 전용 프롬프트: Granite 초기화 -> TDS UI -> 기능 -> 광고 SDK -> 빌드/심사
  - `generated_prompts.appintoss` 키에 저장된다 (default와 분리)
  - `formatAitPrompt()`으로 심사 체크리스트(운영/디자인/기능/보안)가 포함된다

---

## 2. 비기능 요구사항 (Non-Functional Requirements)

### NFR-001: 성능

- **응답 시간**:
  - 피드 API (`/api/ideas`): 500ms 이내 (CDN 캐시 `s-maxage=300, stale-while-revalidate`)
  - 프롬프트 생성 (Groq): 10초 이내
  - 프롬프트 생성 (로컬 브릿지): 90초 이내 (CLI 실행 시간 포함)
  - 다이제스트 API: 300ms 이내
  - 앱인토스 분석: 5초 이내
- **처리량**:
  - 수집 CRON: 7개 소스 x 10개 = 최대 70개/실행, 10분 이내 완료 (500ms 딜레이 포함)
  - 동시 사용자: 현재 1인 사용 기준. Vercel Serverless 자동 스케일링으로 확장
- **수용 기준**:
  - 수집 크론 전체 실행이 10분 이내에 완료된다
  - 피드 API가 CDN 캐시 적중 시 50ms 이내에 응답한다
  - 프롬프트 생성 중 UI가 로딩 상태를 표시한다

### NFR-002: 안정성 (Reliability)

- **가용성**: 99% (Vercel SLA 기반)
- **장애 격리**:
  - 개별 수집기 실패 시 나머지 정상 동작 (try/catch 격리)
  - AI 분석 실패 시 기본값 폴백 (서비스 중단 없음)
  - 프롬프트 생성 3단계 폴백: 로컬 CLI -> Groq -> 하드코딩 기본값
- **재시도**: `collectWithRetry` 3회, 지수 백오프 (1초, 2초, 3초)
- **수용 기준**:
  - 단일 수집기 장애가 전체 수집 프로세스를 중단하지 않는다
  - Groq API 장애 시에도 기본값으로 아이디어가 저장된다
  - 동시 프롬프트 생성 요청 시 원자적 잠금으로 데이터 무결성이 보장된다

### NFR-003: 보안

- **인증**:
  - CRON 엔드포인트: `crypto.timingSafeEqual()` 기반 CRON_SECRET 검증
  - 프롬프트 생성: API_SECRET 환경변수 인증 (프로덕션)
  - UUID 파라미터: 정규식 검증
- **입력 검증**:
  - sort: `ALLOWED_SORTS` Set 화이트리스트 (`trend_score`, `latest`, `ait_score`)
  - source: `ALLOWED_SOURCES` Set 화이트리스트 (6개 소스)
  - tag: `[\w\s-]{1,50}` 정규식
  - limit: `Math.min(MAX_LIMIT=50, Math.max(1, value))`
  - page: `Math.min(100, Math.max(0, value))`
- **데이터 보호**: Supabase RLS (공개 읽기, service_role만 쓰기)
- **전송 보안**: HTTPS 전용 (Vercel 기본)
- **보안 헤더**: X-Frame-Options, X-Content-Type-Options, CSP
- **브릿지**: CORS 제한, 1MB 바디 제한, 127.0.0.1 바인딩
- **수용 기준**:
  - CRON_SECRET 없이 `/api/cron/collect` 호출 시 401이 반환된다
  - 유효하지 않은 UUID로 프롬프트 생성 요청 시 400이 반환된다
  - SQL Injection이 불가능하다 (Supabase SDK 파라미터 바인딩)

### NFR-004: 가용성

- **배포**: Vercel Hobby 플랜 (무료)
  - CDN 캐시: `s-maxage=300` (5분)
  - Serverless Functions: 자동 스케일링
  - 크론 잡: 매일 06:00 UTC
- **장애 복구**: Vercel 자동 재배포, Supabase 자동 백업
- **수용 기준**:
  - 서비스 다운타임이 월 7시간 이내이다 (99% 가용성)
  - 배포 실패 시 이전 버전이 자동으로 유지된다 (Vercel 롤백)

### NFR-005: 유지보수성

- **코드 품질**:
  - TypeScript 5.9.3 strict 모드
  - `types/idea.ts` 공통 타입 정의 (Idea, PlatformAnalysis, GeneratedPrompts, AitGeneratedPrompts, Digest)
  - ESLint 코드 스타일 통일
  - `any` 타입 최소화
- **테스트**:
  - Jest 단위 테스트 25개 (4 suites) 전체 통과
  - Playwright E2E 설정 완료
- **문서**: README.md, docs/ 디렉토리
- **CI/CD**: GitHub Actions (ci.yml, deploy.yml)
- **수용 기준**:
  - `npm run test`가 0 failures로 통과한다
  - `npx tsc --noEmit`이 에러 없이 통과한다
  - `npm run build`가 성공한다

---

## 3. 요구사항 요약 매트릭스

| ID | 기능 | 우선순위 | 상태 | 비고 |
|----|------|----------|------|------|
| FR-001 | 멀티소스 아이디어 수집 (7개) | Must | 완료 | 7 collectors + retry + batch dedup |
| FR-002 | 메가앱 필터링 | Must | 완료 | 80+ 패키지 프리픽스 |
| FR-003 | AI 아이디어 분석 | Must | 완료 | llama-3.1-8b-instant, 폴백 기본값 |
| FR-004 | 트렌드 점수 계산 | Must | 완료 | calcTrendScore 가중 합산 |
| FR-005 | 프롬프트 생성 | Must | 완료 | 템플릿 기반, llama-3.3-70b-versatile |
| FR-006 | 필터 및 정렬 | Must | 완료 | 화이트리스트 검증, 3가지 정렬 |
| FR-007 | 대시보드 피드 | Must | 완료 | IdeaCard, FilterBar, 페이지네이션 |
| FR-008 | 다이제스트 | Should | 완료 | TOP 10 + hot_topics + insights |
| FR-009 | 앱인토스 적합도 분석 | Should | 완료 | ait_score 0-100, 원자적 잠금 |
| FR-010 | 앱인토스 전용 프롬프트 | Should | 완료 | TDS/Granite, 5단계 전용 |
| NFR-001 | 성능 (수집 10분 이내) | Must | 충족 | CDN 캐시, 500ms 딜레이 |
| NFR-002 | 안정성 (retry, 폴백) | Must | 충족 | 3회 재시도, 3단계 폴백 체인 |
| NFR-003 | 보안 (RLS, 인증, 검증) | Must | 기본 충족 | Rate Limiting 미적용 |
| NFR-004 | 가용성 (Vercel 99%) | Should | 충족 | CDN, 자동 스케일링 |
| NFR-005 | 유지보수성 (TS, 테스트) | Should | 기본 충족 | E2E 테스트 추가 필요 |
