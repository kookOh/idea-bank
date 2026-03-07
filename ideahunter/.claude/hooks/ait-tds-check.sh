#!/bin/bash
# 앱인토스 TDS 준수 검증 Hook (PostToolUse: JSX/TSX 수정 후)
# TDS 컴포넌트 사용 권장, 토스 컬러 팔레트, 접근성 검증

FILE="$1"

# .tsx, .jsx 파일만 검사
if [[ ! "$FILE" =~ \.(tsx|jsx)$ ]]; then
  exit 0
fi

# 앱인토스 프로젝트가 아니면 스킵
if [ ! -f "granite.config.ts" ] && [ ! -f "granite.config.js" ]; then
  exit 0
fi

WARNINGS=""

# TDS 미사용 시 권장
if ! grep -qE '@toss/tds|tds-mobile|tds-react-native' "$FILE" 2>/dev/null; then
  # JSX가 포함된 파일인지 확인
  if grep -qE '<[A-Z][a-zA-Z]*' "$FILE" 2>/dev/null; then
    WARNINGS="${WARNINGS}\n💡 [AIT TDS] TDS 컴포넌트 import 없음 — @toss/tds-mobile 사용 권장"
  fi
fi

# 접근성: 이미지에 alt 없음
if grep -qE '<img[^>]*(?!alt)' "$FILE" 2>/dev/null; then
  WARNINGS="${WARNINGS}\n💡 [AIT 접근성] <img> 태그에 alt 속성 누락 가능 — 접근성 심사 대비 필요"
fi

# 버튼에 aria-label 없음 (아이콘만 있는 버튼)
if grep -qE '<button[^>]*>[^<]*<\/button>' "$FILE" 2>/dev/null; then
  if grep -qE '<button[^>]*>(\s*<(span|svg|img)[^>]*>[^<]*<\/(span|svg|img)>\s*)<\/button>' "$FILE" 2>/dev/null; then
    if ! grep -qE 'aria-label' "$FILE" 2>/dev/null; then
      WARNINGS="${WARNINGS}\n💡 [AIT 접근성] 아이콘 버튼에 aria-label 권장"
    fi
  fi
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS"
fi

exit 0
