#!/bin/bash
# session-index.sh — Index sessions for QMD recall
# Usage: .claude/scripts/session-index.sh
# Called after session-sync or manually

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../local.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

VAULT_DIR="${VAULT_DIR:-}"
PROJECT_NAME="${PROJECT_NAME:-ideahunter}"
QMD_SESSION_DAYS="${QMD_SESSION_DAYS:-30}"

if ! command -v qmd &>/dev/null; then
  echo "[session-index] qmd not installed. Skipping indexing."
  echo "[session-index] Install: npm install -g @nichochar/qmd"
  exit 0
fi

if [[ -z "$VAULT_DIR" ]]; then
  echo "[session-index] VAULT_DIR not set. Skipping."
  exit 0
fi

SESSIONS_DIR="$VAULT_DIR/Claude Sessions/$PROJECT_NAME"
if [[ ! -d "$SESSIONS_DIR" ]]; then
  echo "[session-index] No sessions directory: $SESSIONS_DIR"
  exit 0
fi

COLLECTION="ideahunter-sessions"

echo "[session-index] Indexing $SESSIONS_DIR into collection: $COLLECTION"

# Create or update QMD collection
qmd update 2>/dev/null || {
  echo "[session-index] qmd update failed. Attempting to add collection first..."
  qmd collection add "$SESSIONS_DIR" --name "$COLLECTION" --mask "*.md" 2>/dev/null || {
    echo "[session-index] Could not add QMD collection."
    echo "[session-index] Manual steps:"
    echo "  qmd collection add \"$SESSIONS_DIR\" --name $COLLECTION --mask \"*.md\""
    echo "  qmd update"
    exit 0
  }
  qmd update 2>/dev/null
}

echo "[session-index] Indexing complete for $COLLECTION"
