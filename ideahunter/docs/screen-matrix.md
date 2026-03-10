# Screen Matrix

IdeaHunter 화면/라우트 매트릭스.

---

## / (메인 피드)

- **설명**: 트렌딩 비즈니스 아이디어 피드
- **컴포넌트 트리**:
  ```
  Home (app/page.tsx)
  +-- header (sticky, nav links)
  +-- DigestBanner
  +-- FilterBar
  |   +-- 정렬 select (trend_score / latest / ait_score)
  |   +-- 소스 select (hackernews, reddit, ...)
  |   +-- 태그 input
  |   +-- 앱인토스 전용 toggle
  +-- IdeaCard[] (그리드)
  |   +-- 기본 정보 (제목, 출처 배지, 점수, 댓글 수)
  |   +-- AI 분석 (난이도, 수익성, 경쟁도, 추천 스택)
  |   +-- 태그 목록
  |   +-- 프롬프트 생성 버튼 -> ImplementationModal
  |   +-- 앱인토스 분석 버튼 (platform_analysis 없을 때)
  |   +-- 앱인토스 점수 배지 (platform_analysis 있을 때)
  +-- "더 보기" 버튼 (페이지네이션)
  +-- 로딩/에러/빈 상태 표시
  ```
- **데이터 소스**: `GET /api/ideas?sort=&source=&tag=&page=&limit=`
- **사용자 액션**:
  - 정렬 변경 (트렌드 점수 / 최신 / 앱인토스 점수)
  - 소스 필터 선택
  - 태그 필터 입력
  - 앱인토스 전용 토글 (ait_score >= 70 필터)
  - 아이디어 카드 클릭 (상세 확장)
  - "프롬프트 생성" 클릭 -> ImplementationModal 열기
  - "앱인토스 분석" 클릭 -> POST /api/ideas/{id}/analyze-ait
  - "더 보기" 클릭 -> 다음 페이지 로드 (append)
  - 네비게이션: 피드 / 오늘의 TOP 10 / 앱인토스
- **반응형**:
  - 데스크톱: max-w-5xl 중앙 정렬, 카드 세로 목록
  - 모바일: 전체 너비, 패딩 축소, sticky 헤더 유지

---

## /ait (앱인토스 대시보드)

- **설명**: Apps-in-Toss (토스 미니앱) 적합 아이디어 대시보드
- **컴포넌트 트리**:
  ```
  AitDashboard (app/ait/page.tsx)
  +-- header (sticky, nav links)
  +-- 카테고리 섹션[] (ait_category 별 그룹)
  |   +-- 카테고리 헤더 (이름 배지 + 개수)
  |   +-- IdeaCard[] (해당 카테고리 아이디어)
  +-- 로딩/에러/빈 상태 표시
  ```
- **데이터 소스**: `GET /api/ideas?sort=trend_score&limit=50` (클라이언트에서 platform_analysis 필터 + ait_score 정렬)
- **사용자 액션**:
  - 카테고리별 아이디어 탐색
  - 아이디어 카드 클릭 (상세 확장)
  - "프롬프트 생성" 클릭 -> ImplementationModal (appintoss 모드)
  - 네비게이션: 피드 / 오늘의 TOP 10 / 앱인토스
- **반응형**:
  - 데스크톱: max-w-5xl 중앙 정렬, 카테고리별 섹션
  - 모바일: 전체 너비, 카테고리 섹션 세로 스택

---

## /digest (다이제스트)

- **설명**: 오늘의 Hot 아이디어 TOP 10 일일 요약
- **컴포넌트 트리**:
  ```
  DigestPage (app/digest/page.tsx)
  +-- header (sticky, nav links)
  +-- 타이틀 섹션 (날짜, 아이디어 수)
  +-- 순위 목록
  |   +-- 순위 번호 (#1, #2, ...)
  |   +-- IdeaCard (각 아이디어)
  +-- 로딩/에러/빈 상태 표시
  ```
- **데이터 소스**: `GET /api/digest` (Digest 타입)
  - 캐시된 다이제스트 (daily_digests 테이블): Cache-Control 3600s
  - 실시간 폴백: 최근 24시간 아이디어 trend_score 상위 10개
- **사용자 액션**:
  - 순위별 아이디어 탐색
  - 아이디어 카드 클릭 (상세 확장)
  - "프롬프트 생성" 클릭 -> ImplementationModal
  - 네비게이션: 피드 / 오늘의 TOP 10
- **반응형**:
  - 데스크톱: max-w-4xl 중앙 정렬, 순위 번호 왼쪽 표시
  - 모바일: 전체 너비, 순위 번호 축소 또는 인라인

---

## 공통 모달

### ImplementationModal

- **트리거**: IdeaCard 내 "프롬프트 생성" 버튼 클릭
- **데이터 소스**: `POST /api/ideas/{id}/generate-prompts?platform=&force=`
- **사용자 액션**:
  - 프롬프트 탭 전환 (마스터 프롬프트 / 단계별 / 스택)
  - 프롬프트 텍스트 클립보드 복사
  - 모달 닫기

### DigestBanner

- **위치**: 메인 피드 (/) 상단
- **데이터 소스**: 없음 (링크만)
- **사용자 액션**: /digest 페이지로 이동
