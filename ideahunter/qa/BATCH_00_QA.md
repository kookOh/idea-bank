# Batch 00: Launch Hardening — QA Report

## 메타
- batch: Batch 00
- 리뷰 일시: 2026-03-10
- 최종 판정: CLOSED (CRITICAL=0, HIGH=0)

## 보안 리뷰 결과

### CRITICAL (P0): 0건

### HIGH (P1): 2건 → 수정 완료
| # | 이슈 | 파일 | 수정 내용 |
|---|------|------|-----------|
| 1 | verifyApiKey fail-open | lib/auth.ts:26 | fail-closed로 변경 (API_SECRET 미설정 시 false 반환) |
| 2 | save-prompts 무제한 body | save-prompts/route.ts | 50KB body 제한 + master_prompt 30K, project_name 100, overview 1K 길이 제한 |

### MEDIUM (P2): 5건 → 4건 수정, 1건 DEFERRED
| # | 이슈 | 파일 | 수정 내용 |
|---|------|------|-----------|
| 3 | rate limiting 없음 | - | DEFERRED (Upstash 등 외부 서비스 필요) |
| 4 | CSP/HSTS 헤더 없음 | next.config.ts | CSP + HSTS + X-XSS-Protection 추가 |
| 5 | cron/digest 에러 메시지 노출 | cron/digest/route.ts:75 | generic 'Internal server error' 메시지로 변경 |
| 6 | SELECT * 로 raw_data 노출 | ideas/route.ts, digest/route.ts | 명시적 컬럼 지정으로 변경 |
| 7 | source_url javascript: XSS | IdeaCard.tsx:75 | http 프로토콜 체크 추가 |

### LOW (P3): 4건 → 수용 (non-blocking)
- save-prompts body size limit (Next.js 기본 1MB 한도 존재)
- Supabase client per-request 인스턴스화 (경량, 성능 영향 미미)
- cron error 로그에 raw error 포함 (내부 DB, 외부 노출 없음)
- X-XSS-Protection legacy 헤더 (추가됨)

## E2E 테스트 결과
| 파일 | 테스트 수 | 커버리지 |
|------|-----------|----------|
| e2e/feed.spec.ts | 6 | 메인 피드, 헤더, 네비게이션, 필터, 카드, 빈 상태 |
| e2e/ait-dashboard.spec.ts | 6 | /ait 페이지, 콘텐츠, 네비게이션 |
| e2e/digest.spec.ts | 5 | /digest 페이지, 제목, 아이디어 목록, 빈 상태 |
| e2e/prompt-modal.spec.ts | 5 | 모달 열기/닫기, 프롬프트 생성, 탭 전환 |
| **합계** | **22** | 핵심 사용자 플로우 4개 시나리오 |

## 빌드/테스트 검증
- next build: 통과 (10 routes, 0 warnings)
- npm test: 52/52 통과
- npm audit: 0 vulnerabilities
- Cache-Control: ideas s-maxage=300, digest s-maxage=3600 (정상)

## close pass 체크리스트
- [x] 구현 존재
- [x] 리뷰 완료 (보안 리뷰 + 코드 리뷰)
- [x] hardening 완료 (HIGH 2건 수정)
- [x] close pass 완료
- [x] CRITICAL = 0
- [x] HIGH = 0
- [x] closure-blocking issue = 0
- [x] 빌드 통과
- [x] 테스트 통과
