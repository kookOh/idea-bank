#!/bin/bash
# IdeaHunter 수동 수집/분석 스크립트
# 사용법: ./scripts/manual-run.sh [collect|digest|all]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"

# 배포 URL (필요시 변경)
DEPLOYMENT_URL="${IDEAHUNTER_URL:-https://ideahunter-juw33tl1k-modneycare.vercel.app}"

# .env.local 로드
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi
source "$ENV_FILE"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "ERROR: CRON_SECRET not set in .env.local"
  exit 1
fi

run_collect() {
  echo "==> Collecting ideas from 6 sources..."
  result=$(npx vercel curl /api/cron/collect \
    --deployment "$DEPLOYMENT_URL" \
    -- -s -H "Authorization: Bearer $CRON_SECRET")
  echo "    Result: $result"
}

run_digest() {
  echo "==> Generating daily digest..."
  result=$(npx vercel curl /api/cron/digest \
    --deployment "$DEPLOYMENT_URL" \
    -- -s -H "Authorization: Bearer $CRON_SECRET")
  echo "    Result: $result"
}

command="${1:-all}"

case "$command" in
  collect)
    run_collect
    ;;
  digest)
    run_digest
    ;;
  all)
    run_collect
    echo ""
    run_digest
    ;;
  *)
    echo "Usage: $0 [collect|digest|all]"
    echo ""
    echo "  collect  - Collect & analyze ideas from 6 sources"
    echo "  digest   - Generate daily digest from top ideas"
    echo "  all      - Run both collect and digest (default)"
    exit 1
    ;;
esac

echo ""
echo "Done!"
