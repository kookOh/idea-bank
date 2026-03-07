#!/bin/bash
# 앱인토스 정책 준수 검증 Hook (PreToolUse: Write/Edit)
# 금지 패턴 감지 시 경고 출력

FILE="$1"

# .tsx, .ts, .jsx, .js 파일만 검사
if [[ ! "$FILE" =~ \.(tsx?|jsx?)$ ]]; then
  exit 0
fi

# 앱인토스 프로젝트가 아니면 스킵 (granite.config.ts 존재 여부)
if [ ! -f "granite.config.ts" ] && [ ! -f "granite.config.js" ]; then
  exit 0
fi

WARNINGS=""

# 외부 링크/앱 설치 유도 패턴
if grep -qE 'window\.open|location\.href|location\.replace|location\.assign' "$FILE" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️ [AIT 정책] window.open/location.href 사용 감지 — 외부 브라우저 열기 금지"
fi

# 금융 API 패턴
if grep -qiE 'stock|investment|crypto|bitcoin|ethereum|trading|금융|투자|주식|암호화폐' "$FILE" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️ [AIT 정책] 금융/투자/디지털자산 관련 코드 감지 — 앱인토스 금지 영역"
fi

# 개인정보 수집 패턴
if grep -qE 'navigator\.geolocation|getUserMedia|contacts|phoneNumber' "$FILE" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️ [AIT 정책] 개인정보 수집 패턴 감지 — 최소 수집 원칙 확인 필요"
fi

# eval/Function 동적 코드 실행
if grep -qE '\beval\s*\(|new\s+Function\s*\(' "$FILE" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️ [AIT 보안] eval()/Function() 사용 감지 — 동적 코드 실행 금지"
fi

# innerHTML XSS 위험
if grep -qE '\.innerHTML\s*=' "$FILE" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n⚠️ [AIT 보안] innerHTML 직접 할당 감지 — XSS 위험"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

exit 0
