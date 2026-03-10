#!/bin/bash
# 앱인토스 빌드 무결성 Hook (PostToolUse: package.json/granite.config.ts 변경 시)
# SDK 버전, 금지 패키지, 필수 필드 검증

FILE="$1"

# package.json 또는 granite.config.ts 변경 시에만 실행
if [[ "$FILE" != *"package.json" ]] && [[ "$FILE" != *"granite.config"* ]]; then
  exit 0
fi

# 앱인토스 프로젝트가 아니면 스킵
if [ ! -f "granite.config.ts" ] && [ ! -f "granite.config.js" ]; then
  exit 0
fi

WARNINGS=""

# package.json 검증
if [[ "$FILE" == *"package.json" ]]; then
  # SDK 버전 확인 (2.0.1+ 필수)
  if grep -q '@apps-in-toss' "$FILE" 2>/dev/null; then
    SDK_VERSION=$(grep -oP '"@apps-in-toss/[^"]*":\s*"\K[^"]+' "$FILE" 2>/dev/null | head -1)
    if [ -n "$SDK_VERSION" ]; then
      # 간단한 버전 비교 (2.0.1 미만 경고)
      MAJOR=$(echo "$SDK_VERSION" | sed 's/[\^~]//g' | cut -d. -f1)
      MINOR=$(echo "$SDK_VERSION" | sed 's/[\^~]//g' | cut -d. -f2)
      PATCH=$(echo "$SDK_VERSION" | sed 's/[\^~]//g' | cut -d. -f3)
      if [ "${MAJOR:-0}" -lt 2 ] || ([ "${MAJOR:-0}" -eq 2 ] && [ "${MINOR:-0}" -eq 0 ] && [ "${PATCH:-0}" -lt 1 ]); then
        WARNINGS="${WARNINGS}\n⚠️ [AIT SDK] SDK 버전 ${SDK_VERSION} — 2.0.1+ 필수 (2026.3.23 이후 심사 필수)"
      fi
    fi
  fi

  # 금지 npm 패키지 확인
  BANNED_PACKAGES=("puppeteer" "selenium" "cheerio" "request" "axios-retry")
  for pkg in "${BANNED_PACKAGES[@]}"; do
    if grep -q "\"$pkg\"" "$FILE" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n⚠️ [AIT 패키지] ${pkg} 감지 — 앱인토스에서 불필요하거나 금지될 수 있는 패키지"
    fi
  done
fi

# granite.config.ts 검증
if [[ "$FILE" == *"granite.config"* ]]; then
  # 필수 필드 확인
  for field in "appId" "name" "version" "sdk"; do
    if ! grep -q "$field" "$FILE" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n⚠️ [AIT Config] granite.config에 필수 필드 '${field}' 누락"
    fi
  done
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

exit 0
