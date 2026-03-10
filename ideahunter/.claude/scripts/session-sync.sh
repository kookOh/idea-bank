#!/bin/bash
# session-sync.sh — Sync Claude Code sessions to Obsidian vault
# Usage: .claude/scripts/session-sync.sh
# Called at session boundaries (not per-prompt)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../local.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi

VAULT_DIR="${VAULT_DIR:-}"
PROJECT_NAME="${PROJECT_NAME:-ideahunter}"

if [[ -z "$VAULT_DIR" ]]; then
  echo "[session-sync] VAULT_DIR not set. Skipping sync."
  exit 0
fi

if [[ ! -d "$VAULT_DIR" ]]; then
  echo "[session-sync] VAULT_DIR does not exist: $VAULT_DIR"
  exit 0
fi

SESSIONS_DIR="$VAULT_DIR/Claude Sessions/$PROJECT_NAME"
mkdir -p "$SESSIONS_DIR"

echo "[session-sync] Syncing sessions for $PROJECT_NAME to $SESSIONS_DIR"

# Use sync-claude-sessions if the skill is available via Claude Code
# This script is a lightweight fallback/wrapper
JSONL_DIR="$HOME/.claude/projects/-Users-kook-Documents-github-idea-bank-ideahunter"

if [[ -d "$JSONL_DIR" ]]; then
  LATEST=$(ls -t "$JSONL_DIR"/*.jsonl 2>/dev/null | head -1)
  if [[ -n "$LATEST" ]]; then
    BASENAME=$(basename "$LATEST" .jsonl)
    DEST="$SESSIONS_DIR/${BASENAME}.md"
    if [[ ! -f "$DEST" ]]; then
      echo "[session-sync] Extracting session $BASENAME"
      echo "# Claude Session: $BASENAME" > "$DEST"
      echo "Project: $PROJECT_NAME" >> "$DEST"
      echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$DEST"
      echo "Source: $LATEST" >> "$DEST"
      echo "" >> "$DEST"
      echo "Session JSONL available at: \`$LATEST\`" >> "$DEST"
      echo "[session-sync] Saved to $DEST"
    else
      echo "[session-sync] Session $BASENAME already synced"
    fi
  fi
else
  echo "[session-sync] No JSONL directory found for this project"
fi

echo "[session-sync] Done"
