---
trigger: "앱인토스 심사 준비|ait review|앱인토스 검수"
---

# 앱인토스 심사 대비 자동 스캔

사용자가 앱인토스 심사를 준비하려 합니다. 4단계 심사 기준으로 코드를 자동 스캔합니다.

## 1단계: 운영 심사

다음 항목을 확인하세요:
- [ ] 앱 이름이 앱인토스 가이드라인을 준수하는가 (granite.config.ts의 name 필드)
- [ ] 앱 설명이 실제 기능을 정확하게 반영하는가
- [ ] 스크린샷이 5장 이상 준비되었는가
- [ ] 개인정보 처리방침 URL이 유효한가
- [ ] 연락처 정보가 최신인가

## 2단계: 디자인 심사

코드에서 다음을 스캔하세요:
- `grep -r "className=" --include="*.tsx" --include="*.jsx"` 로 커스텀 스타일 확인
- TDS 컴포넌트 import 확인: `@toss/tds-mobile` 또는 `@toss/tds-react-native`
- 토스 컬러 팔레트 준수 여부
- NavigationBar 규격 확인
- 다크모드 지원 여부 (prefers-color-scheme 또는 TDS 테마)
- 접근성: aria-label, role, alt 텍스트

## 3단계: 기능 심사

코드에서 다음을 확인하세요:
- 에러 바운더리 존재 여부
- 빈 상태(empty state) 처리
- 로딩 상태 처리
- 네트워크 에러 핸들링
- 뒤로가기 동작 정상 여부

## 4단계: 보안 심사

코드에서 다음 패턴을 스캔하세요 (발견 시 경고):
- `window.open` — 외부 브라우저 열기 금지
- `location.href` / `location.replace` — 외부 리다이렉트 금지
- `document.cookie` — 쿠키 직접 접근 주의
- `eval(` / `Function(` — 동적 코드 실행 금지
- `innerHTML` — XSS 위험
- `localStorage` / `sessionStorage` — 민감 데이터 저장 주의
- 외부 앱 스토어 링크 (play.google.com, apps.apple.com)
- 금융 관련 API 호출

## 검수 리포트 생성

스캔 결과를 `docs/review-report.md`에 저장하세요:
```markdown
# 앱인토스 심사 검수 리포트

## 운영 심사: PASS/FAIL
## 디자인 심사: PASS/FAIL
## 기능 심사: PASS/FAIL
## 보안 심사: PASS/FAIL

### 발견된 이슈
- [이슈 1]: 파일명:라인 — 설명
```
