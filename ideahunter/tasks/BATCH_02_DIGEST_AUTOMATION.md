# Batch 02: 일일 다이제스트 자동 생성

## 메타
- 상태: CLOSED
- launch-critical: N
- 생성일: 2026-03-10
- 완료일: 2026-03-10
- 목표: 다이제스트 자동 생성 체이닝 + hot_topics/market_insights UI 표시

## 범위
1. digest 생성 로직을 공유 함수로 추출 (lib/digest-generator.ts)
2. collect cron 끝에 digest 생성 체이닝 (Vercel Hobby 크론 제한 우회)
3. /digest 페이지에 hot_topics 키워드 칩 + market_insights 카드 표시
4. /digest 네비게이션에 앱인토스 링크 추가 (일관성)
5. DigestBanner에 hot_topics 미리보기 추가

## out of scope
- 알림 (이메일/Slack) — 외부 서비스 필요, DEFERRED
- 새 vercel.json cron 추가 — Hobby 제한

## 수용 기준
- [x] digest 생성이 collect cron에 체이닝됨
- [x] /digest 페이지에 hot_topics, market_insights 표시
- [x] DigestBanner에 hot_topics 미리보기 표시
- [x] cron/digest 수동 트리거 유지
- [x] 테스트 5개 추가 (총 57/57 통과)
- [x] 빌드 통과

## 작업 항목
| # | 작업 | 상태 |
|---|------|------|
| 1 | lib/digest-generator.ts 공유 함수 추출 | DONE |
| 2 | cron/collect에 digest 체이닝 | DONE |
| 3 | cron/digest를 공유 함수 사용으로 리팩터 | DONE |
| 4 | /digest 페이지 hot_topics + market_insights UI | DONE |
| 5 | DigestBanner hot_topics 미리보기 | DONE |
| 6 | digest-generator 테스트 작성 | DONE |

## 상태 전이 기록
| 일시 | 변경 | 비고 |
|------|------|------|
| 2026-03-10 | NOT STARTED → OPEN | ralplan 완료 |
| 2026-03-10 | OPEN → REVIEW | ralph 완료 |
| 2026-03-10 | REVIEW → CLOSED | CRITICAL=0, HIGH=0 |
