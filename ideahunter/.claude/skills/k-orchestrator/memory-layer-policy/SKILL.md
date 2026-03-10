---
name: memory-layer-policy
description: Use when working with recall, sync-claude-sessions, Obsidian, or QMD. Enforce secondary-memory rules without overriding repo source of truth.
---

When dealing with memory integration:

1. OMC remains the primary execution engine
2. recall / sync / Obsidian / QMD are secondary memory only
3. Never let recall results override code or repo docs
4. Only use `recall` when:
   - session state is genuinely unclear
   - a real blocker exists
   - a context switch requires recovery
5. Do not call `recall` every phase
6. Prefer SessionEnd or batch-boundary sync
7. Do not enable per-prompt or per-phase auto-sync by default
8. `.omc/notepad.md` must stay short: active batch, current blocker, next action only
9. `VAULT_DIR` must point to the real Obsidian vault root absolute path, not the project docs folder
10. If memory integration is not clearly needed, do not add it
11. UserPromptSubmit-based auto-sync is prohibited
12. QMD/Obsidian index updates: SessionEnd or manual maintenance only
