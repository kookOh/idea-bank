# Batch 03: 데이터 품질 개선

## 메타
- 상태: CLOSED
- launch-critical: N
- 생성일: 2026-03-10
- 완료일: 2026-03-10
- 목표: Play Store 앱 이름 정확성 확보 + 전체 앱 소스 description 품질 향상

## 범위
1. Play Store 수집기: HTML 스크래핑 → google-play-scraper npm 패키지 전환
2. AppBrain/AppStore description 보강
3. AI 분석 프롬프트: 소스 유형 맥락 전달
4. mega-filter: 게임 카테고리 제외 필터 추가

## out of scope
- DB 스키마 변경
- API 라우트 변경
- UI 변경
- 새 수집 소스 추가

## 수용 기준
- [x] Play Store에서 앱 이름이 정확하게 수집됨 (google-play-scraper)
- [x] description에 장르/개발자/요약 포함
- [x] 게임 카테고리 자동 제외
- [x] AI 분석에 소스 맥락 전달
- [x] AppBrain fallback 유지
- [x] 테스트 65/65 통과
- [x] 빌드 통과

## 작업 항목
| # | 작업 | 상태 |
|---|------|------|
| 1 | playstore.ts google-play-scraper 전환 | DONE |
| 2 | mega-filter 카테고리 필터 추가 | DONE |
| 3 | appbrain.ts description 개선 | DONE |
| 4 | appstore.ts description 개선 | DONE |
| 5 | analyzer.ts 소스 맥락 전달 | DONE |
| 6 | cron/collect analyzeIdea source 전달 | DONE |
| 7 | 테스트 업데이트 | DONE |

## 상태 전이 기록
| 일시 | 변경 | 비고 |
|------|------|------|
| 2026-03-10 | NOT STARTED → OPEN | ralplan 완료 |
| 2026-03-10 | OPEN → REVIEW | ralph 완료 |
| 2026-03-10 | REVIEW → CLOSED | CRITICAL=0, HIGH=0 |
