# IdeaHunter - 기능 우선순위 (MoSCoW)

> 최종 업데이트: 2026-03-10
> 버전: v0.4 (Foundation Pack)

---

## Must Have (필수)

서비스의 핵심 가치를 구성하는 기능. 이 기능들 없이는 IdeaHunter가 아니다.

| 기능 | 설명 | 상태 | 구현 파일 |
|------|------|------|-----------|
| **7개 소스 자동 수집** | HackerNews, Reddit, ProductHunt, GitHub, PlayStore, AppStore, AppBrain에서 자동 수집. 소스당 최대 10개, 배치 중복 체크, `collectWithRetry` 3회 재시도 | 완료 | `lib/collectors/*.ts`, `api/cron/collect/route.ts` |
| **메가앱 필터링** | Big Tech/대형 앱 패키지 자동 제외. 80+ 패키지 프리픽스 매칭 (Google, Apple, Meta, Samsung, Kakao, Tencent 등) | 완료 | `lib/collectors/mega-filter.ts` |
| **AI 아이디어 분석** | Groq `llama-3.1-8b-instant`로 한국어 요약, 시장규모, 난이도(1-5), 수익잠재력(1-5), 경쟁도(1-5), 추천스택, MVP일수, 태그 분석. 실패 시 기본값 폴백 | 완료 | `lib/ai/analyzer.ts` |
| **트렌드 점수 계산** | `calcTrendScore`: score/댓글/수익잠재력/구현용이성 가중 합산. `round(base*0.1 + potential + ease)` | 완료 | `lib/ai/analyzer.ts` |
| **한국어 요약** | 모든 아이디어에 대해 한국어 2-3문장 핵심 요약(`summary_ko`) 자동 생성. 피드에서 `summary_ko IS NOT NULL` 필터 | 완료 | `lib/ai/analyzer.ts` |
| **Claude Code 프롬프트 생성** | 템플릿 기반 마스터 프롬프트 + 5단계 프롬프트 자동 생성. LLM(`llama-3.3-70b-versatile`)은 기술 상세만 담당. 캐싱, 원자적 잠금, 강제 재생성 | 완료 | `lib/ai/prompt-generator.ts`, `api/ideas/[id]/generate-prompts/route.ts` |
| **필터 및 정렬** | 소스별(6개), 태그별, 정렬(트렌드/최신/AIT점수) 3가지. 화이트리스트 검증, 정규식 검증 | 완료 | `components/FilterBar.tsx`, `api/ideas/route.ts` |
| **대시보드 피드** | IdeaCard 카드 목록, FilterBar, "더 보기" 페이지네이션, 로딩/에러/빈 상태 처리 | 완료 | `app/page.tsx`, `components/IdeaCard.tsx` |
| **CRON 자동 수집** | Vercel Cron `0 6 * * *` (매일 06:00 UTC). `verifyCronSecret` + `crypto.timingSafeEqual` 인증 | 완료 | `api/cron/collect/route.ts`, `vercel.json` |
| **API 입력 검증 & 보안** | sort/source 화이트리스트, tag 정규식, limit 최대 50, UUID 검증, RLS, 보안 헤더, 타이밍 공격 방지 | 완료 | `lib/auth.ts`, `api/ideas/route.ts` |
| **공통 타입 정의** | Idea, PlatformAnalysis, GeneratedPrompts, AitGeneratedPrompts, Digest 타입 | 완료 | `types/idea.ts` |

---

## Should Have (있어야 함)

핵심 경험을 크게 향상시키는 기능. 구현 완료되었으나 품질/완성도 개선이 가능하다.

| 기능 | 설명 | 상태 | 개선 필요 사항 |
|------|------|------|---------------|
| **앱인토스 적합도 분석** | AI로 ait_score(0-100) 평가. 광고수익 30% + 참여도 30% + 구현용이성 20% + 심사통과 20%. 금지 카테고리 사전 필터. 원자적 잠금 | 완료 | 앱인토스 정책 변경 시 실시간 반영. 금지 카테고리 외부 설정화 |
| **앱인토스 전용 프롬프트** | TDS/Granite/AdMob IAA 기반 5단계 전용 프롬프트. webview/react-native 스택 자동 선택. `formatAitPrompt` 템플릿 | 완료 | TDS 컴포넌트 목록 최신화. 실제 Granite 빌드 검증 |
| **강제 재생성** | `force=true` 파라미터로 캐시 무시 후 프롬프트 재생성 | 완료 | UI에서 "재생성" 버튼 UX 개선 |
| **대시보드 (다이제스트)** | TOP 10 아이디어 + hot_topics(3-5개 키워드) + market_insights(2-3문장). UPSERT(date UNIQUE). DigestBanner | 완료 | 날짜별 아카이브 네비게이션. 다이제스트 오래된 경우 비활성화 |
| **앱인토스 대시보드** | `/ait` 전용 페이지. 카테고리별 그룹핑, ait_score 내림차순 | 완료 | 카테고리별 통계 요약. 소스별 필터 지원 |
| **AI 프로바이더 폴백 체인** | 로컬 브릿지(Claude Code CLI -> Codex CLI) -> Groq -> 하드코딩 기본값. CLI 감지 60초 캐싱 | 완료 | 프로바이더별 품질 비교 피드백. 브릿지 자동 감지 개선 |
| **테스트 커버리지** | Jest 25개 (4 suites), Playwright 설정 완료 | 부분 완료 | E2E 핵심 플로우 테스트 추가. 수집기 통합 테스트 |
| **보안 헤더** | X-Frame-Options, X-Content-Type-Options, CSP | 완료 | CSP 세밀한 조정. HSTS 검토 |

---

## Could Have (있으면 좋음)

사용자 경험을 풍부하게 하지만, 없어도 핵심 가치를 전달할 수 있는 기능.

| 기능 | 설명 | 예상 난이도 | 우선순위 |
|------|------|------------|----------|
| **일일 다이제스트 이메일** | Resend로 TOP 10 다이제스트를 구독자에게 매일 발송. 아이디어 요약, 점수, 원본 링크 포함 | 중 | P2 |
| **Slack/Discord 알림** | 고점수(trend_score 임계값 이상) 아이디어 발견 시 웹훅 알림. 제목, 소스, 점수, 링크 포함 | 낮 | P2 |
| **로컬 브릿지 서버 고도화** | 프로바이더 우선순위 설정, 응답 품질 비교 로깅, 자동 재시작 | 중 | P2 |
| **QMD 인덱싱** | Quick Metadata 인덱싱으로 아이디어 검색 최적화 | 중 | P3 |
| **수집 통계 대시보드** | 소스별/일별 수집 건수 차트, 트렌드 변화 그래프. `collect_logs` 기반 | 중 | P2 |
| **커스텀 키워드 트래킹** | 관심 키워드 설정 + 매칭 아이디어 발견 시 알림 | 중 | P2 |
| **아이디어 비교** | 2-3개 아이디어를 나란히 놓고 분석 지표(난이도, 수익성, 경쟁도 등) 비교 | 중 | P2 |
| **북마크/메모** | 아이디어별 개인 메모 + 북마크 관리 (Auth 필요) | 중 | P2 |
| **E2E 테스트** | Playwright로 핵심 플로우 테스트 (피드 조회, 필터, 프롬프트 생성, AIT 분석) | 중 | P1 |
| **Rate Limiting** | Vercel Edge 미들웨어 기반 IP별 요청 제한 (프롬프트 생성 10회/분, 조회 60회/분) | 낮 | P1 |
| **에러 모니터링** | Sentry 무료 플랜 연동. 프로덕션 에러 추적/알림 | 낮 | P1 |
| **Supabase Auth 연동** | 사용자 인증 (이메일/GitHub/Google). 즐겨찾기, 개인 알림의 전제 조건 | 중 | P1 |
| **RSS 피드** | 피드/다이제스트를 RSS 형식으로 구독 가능하게 | 낮 | P3 |
| **프롬프트 히스토리** | 생성된 프롬프트 히스토리 조회 + 버전 비교 | 중 | P3 |
| **PWA 지원** | Service Worker + 오프라인 캐시 + 푸시 알림 | 높 | P3 |
| **다국어 분석** | 한국어 외 영어 요약 추가 | 낮 | P3 |
| **API 공개** | 외부 개발자용 아이디어/분석 데이터 REST API | 중 | P3 |

---

## Won't Have (범위 밖 - 현재 계획에 없음)

IdeaHunter의 핵심 가치와 1인 개발 제약을 고려하여 의도적으로 범위에서 제외한 기능.

| 기능 | 제외 사유 |
|------|-----------|
| **사용자 인증 (v0.x)** | 현재 단계에서 인증은 불필요. 피드/분석/프롬프트가 공개 접근으로 충분. v1.0에서 Could Have로 재검토 |
| **커뮤니티/소셜 기능** | 댓글, 좋아요, 팔로우 등은 IdeaHunter의 핵심 가치(자동 큐레이션)와 무관. 1인 개발 운영 부담 과다 |
| **유료 플랜/결제** | 수익화 계획이 구체화되기 전까지 구현하지 않음. 핵심 기능은 영원히 무료 원칙 |
| **자체 LLM 호스팅** | 비용 과다. Groq 무료 API + 로컬 CLI 폴백으로 품질/비용 모두 충족 |
| **아이디어 자동 생성** | IdeaHunter는 실제 트렌딩 데이터 기반. AI가 생성한 아이디어는 품질/신뢰성 보장 어려움 |
| **코드 자동 생성/실행** | 프롬프트 생성까지가 IdeaHunter 범위. 실제 코드 실행은 Claude Code/Codex 도구에서 수행 |
| **모바일 네이티브 앱** | 웹 반응형으로 모바일 지원 충분. 네이티브 앱 개발/유지보수 비용 대비 가치 낮음 |
| **팀 협업 기능** | 1인 개발자 대상 서비스. 팀 기능은 복잡도 대비 수요 불확실 |
| **유료 API 연동** | Crunchbase, SimilarWeb 등 유료 분석 도구는 LEAN 예산 원칙(Free-First)에 위배 |
| **실시간 채팅/상담** | 고객 지원은 GitHub Issues로 충분. 실시간 채팅 운영 인력 없음 |
| **다중 언어 UI** | 한국어 UI 단일 지원. 타겟 사용자(한국 인디 개발자) 고려 시 영어 UI 우선순위 낮음 |
| **SEO 최적화 블로그** | 콘텐츠 마케팅은 트래픽 확보 후 검토. 현재는 제품 기능에 집중 |

---

## 우선순위 결정 기준

| 기준 | 가중치 | 설명 |
|------|--------|------|
| **사용자 가치** | 40% | 핵심 사용자(한국 인디 개발자, 사이드 프로젝트 빌더)에게 얼마나 큰 가치를 주는가 |
| **구현 비용** | 25% | 1인 개발 기준 구현에 소요되는 시간/노력 (낮/중/높) |
| **운영 비용** | 20% | 무료 서비스만으로 운영 가능한가 (Free-First 원칙) |
| **위험도** | 15% | 구현 실패 시 서비스 안정성에 미치는 영향 |

---

## 다음 스프린트 추천 순서

우선순위와 의존성을 고려한 추천 구현 순서:

```
1. Rate Limiting (P1, 난이도 낮음)
   -> 보안 필수. Vercel Edge 미들웨어 한 파일로 구현 가능
   -> 의존성: 없음

2. E2E 테스트 (P1, 난이도 중간)
   -> Playwright 설정 완료 상태. 핵심 플로우 3-5개만 작성
   -> 피드 조회, 필터 변경, 프롬프트 생성, AIT 분석
   -> 의존성: 없음

3. 에러 모니터링 (P1, 난이도 낮음)
   -> Sentry 무료 플랜 연동. 프로덕션 안정성 확보
   -> 의존성: 없음

4. Supabase Auth (P1, 난이도 중간)
   -> 사용자별 기능(북마크, 알림 등)의 전제 조건
   -> 의존성: 없음 (하지만 후속 기능의 기반)

5. 일일 다이제스트 이메일 (P2, 난이도 중간)
   -> Resend 무료 플랜으로 구현
   -> 의존성: Supabase Auth (구독 관리)
```
