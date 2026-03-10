# Batch 00: Launch Hardening

## 메타
- 상태: CLOSED
- launch-critical: Y
- 생성일: 2026-03-10
- 완료일: 2026-03-10
- 목표: 프로덕션 준비 상태 달성 — 테스트/보안/성능/배포 검증

## 범위
1. E2E 테스트 작성 (Playwright)
   - 메인 피드 → 필터 → 카드 클릭 → 프롬프트 생성 → 복사
   - 앱인토스 분석 → 뱃지 → 앱인토스 프롬프트 → 복사
   - /ait 대시보드 접근
   - /digest 페이지 접근
2. 보안 검증
   - RLS 정책 확인 (public read, service write)
   - CRON_SECRET 인증 테스트
   - UUID 입력 검증 테스트
   - XSS/인젝션 벡터 확인
3. 성능 검토
   - 빌드 사이즈 확인
   - API 응답 시간 (ideas 목록, 프롬프트 생성)
   - Cache-Control 헤더 설정 확인
4. 배포 검증
   - next build 통과 (확인됨)
   - vercel.json 설정 확인
   - 환경변수 목록 문서화

## out of scope
- 새 기능 추가
- UI 리디자인
- 다이제스트 자동화
- Bridge 서버 프로덕션 배포

## 수용 기준 (Acceptance Criteria)
- [x] E2E 테스트 최소 4개 시나리오 작성 (22개 테스트 케이스)
- [x] 보안 리뷰 CRITICAL/HIGH = 0 (HIGH 2건 수정/완화, MEDIUM 5건 중 4건 수정)
- [x] next build 통과 (10 routes)
- [x] 52개 단위 테스트 통과
- [x] 보안 헤더 추가 (CSP, HSTS, X-XSS-Protection)

## 관련 문서
- docs/PRD.md
- docs/launch-checklist.md
- docs/MASTER_BLUEPRINT_PART2.md (보안/배포 섹션)

## QA 문서
- qa/BATCH_00_QA.md (batch 진행 시 생성)

## 작업 항목
| # | 작업 | 상태 | 비고 |
|---|------|------|------|
| 1 | E2E: 메인 피드 → 필터 → 프롬프트 복사 플로우 | DONE | e2e/feed.spec.ts (6 tests) |
| 2 | E2E: 앱인토스 분석 → 프롬프트 복사 플로우 | DONE | e2e/prompt-modal.spec.ts (5 tests) |
| 3 | E2E: /ait 대시보드 페이지 | DONE | e2e/ait-dashboard.spec.ts (6 tests) |
| 4 | E2E: /digest 페이지 | DONE | e2e/digest.spec.ts (5 tests) |
| 5 | 보안: RLS/인증/입력검증 코드 리뷰 | DONE | HIGH 2/2 수정, MEDIUM 4/5 수정 |
| 6 | 성능: 빌드 사이즈 + Cache-Control 확인 | DONE | 빌드 통과, Cache-Control 정상 |
| 7 | 배포: 환경변수 목록 README 문서화 | DEFERRED | Batch 01로 이관 |

## 상태 전이 기록
| 일시 | 변경 | 비고 |
|------|------|------|
| 2026-03-10 | NOT STARTED | bootstrap-ops에서 생성 |
| 2026-03-10 | NOT STARTED → OPEN | ralplan 완료 |
| 2026-03-10 | OPEN → REVIEW | ralph 완료 (E2E 4파일 + 보안리뷰) |
| 2026-03-10 | REVIEW → HARDENING | HIGH 2건 발견 |
| 2026-03-10 | HARDENING → REVIEW | HIGH 수정 완료, 빌드/테스트 통과 |
| 2026-03-10 | REVIEW → CLOSED | CRITICAL=0, HIGH=0, close pass 통과 |
