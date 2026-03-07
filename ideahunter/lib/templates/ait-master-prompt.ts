export const AIT_MASTER_PROMPT_TEMPLATE = `
# 앱인토스(Apps in Toss) 미니앱 마스터 블루프린트

## A. 적합성 평가 (자동 완료)
- **아이디어**: [INSERT_IDEA]
- **앱인토스 적합도**: [AIT_SCORE]/100
- **카테고리**: [AIT_CATEGORY]
- **개발 방식**: [TARGET_TYPE] (WebView: @apps-in-toss/web-framework / React Native: @apps-in-toss/framework)
- **차단 사유**: [BLOCKED_REASON]

## B. 플랫폼 선택 결정
- **선택**: [TARGET_TYPE]
- **근거**: [PLATFORM_RATIONALE]
- **SDK**: 2.0.1+ 필수 (2026.3.23 이후 심사 필수)

## C. 제품 정의
- **앱 이름**: [OPTIONAL_NAME]
- **타겟 사용자**: [TARGET_USERS] (토스 유저 3,000만 중)
- **핵심 가치**: [INSERT_IDEA]의 모바일 최적화 버전
- **수익 모델**: [MONETIZATION]
- **목표**: [GOAL]

## D. 아키텍처 설계
- **프레임워크**: Granite (granite.config.ts)
- **빌드 산출물**: .ait 파일
- **디자인 시스템**: TDS 필수 (@toss/tds-mobile 또는 @toss/tds-react-native)
- **상태 관리**: React Context 또는 Zustand (경량)
- **데이터**: Supabase (무료 티어)

## E. 빌드 전략
- **팀 규모**: [TEAM_SIZE] (기본: 1인)
- **타임라인**: [TIMELINE] (기본: 2주)
- **접근 방식**: [LEAN_OR_NORMAL] (기본: LEAN)
- **단계**:
  1. 프로젝트 초기화 + Granite 설정
  2. TDS 기반 UI 컴포넌트 구축
  3. 핵심 기능 구현
  4. 광고 SDK(AdMob IAA) 통합
  5. granite build → .ait 생성
  6. 심사 대비 체크리스트 확인

## F. Information Architecture
- **화면 구조**:
  - 홈 (메인 기능)
  - 상세 (콘텐츠/기능)
  - 설정 (앱 정보, 알림)
- **네비게이션**: TDS NavigationBar 필수
- **딥링크**: Granite 라우팅 활용

## G. PRD (Product Requirements Document)
- **필수 기능**: 핵심 가치 구현, TDS UI, 광고 통합
- **선택 기능**: 알림, 공유, 분석
- **비기능 요구사항**: 60fps, 3초 이내 초기 로딩, 접근성(WCAG 2.1 AA)

## H. 심사 대비 (4단계)
### 운영 심사
- 앱 이름/설명 가이드라인 준수
- 스크린샷 5장 이상
- 개인정보 처리방침 URL

### 디자인 심사
- TDS 컴포넌트 100% 사용 (커스텀 UI 최소화)
- 토스 컬러 팔레트 준수
- 다크모드 지원

### 기능 심사
- 핵심 기능 정상 동작
- 에러 핸들링 + 빈 상태 처리
- 오프라인 대응

### 보안 심사
- window.open / location.href 사용 금지
- 외부 앱 설치 유도 금지
- 개인정보 최소 수집
- XSS / injection 방지

## I. 10개 런칭 아티팩트 (생성 요청)
다음 10개 파일을 반드시 생성하세요:

1. **APPINTOSS_MASTER_BLUEPRINT.md** — 이 문서의 완성본
2. **PRD.md** — 상세 제품 요구사항
3. **app-architecture.md** — 기술 아키텍처 + 컴포넌트 다이어그램
4. **appintos-integration-plan.md** — 앱인토스 SDK 통합 계획
5. **api-spec.yaml** — API 엔드포인트 명세 (OpenAPI 3.0)
6. **schema.sql** — 데이터베이스 스키마
7. **analytics-events.md** — 분석 이벤트 정의
8. **screen-or-route-matrix.md** — 화면별 라우트 + 컴포넌트 매핑
9. **feature-priority.md** — 기능 우선순위 매트릭스 (MoSCoW)
10. **launch-checklist.md** — 심사 제출 전 최종 체크리스트
`;

export const AIT_TEMPLATE_VARIABLES = [
  'INSERT_IDEA',
  'AIT_SCORE',
  'AIT_CATEGORY',
  'TARGET_TYPE',
  'BLOCKED_REASON',
  'PLATFORM_RATIONALE',
  'OPTIONAL_NAME',
  'TARGET_USERS',
  'MONETIZATION',
  'GOAL',
  'TEAM_SIZE',
  'TIMELINE',
  'LEAN_OR_NORMAL',
] as const;
