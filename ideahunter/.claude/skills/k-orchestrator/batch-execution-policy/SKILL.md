---
name: batch-execution-policy
description: Use when planning or implementing meaningful repo changes in a batch-driven project. Enforce source-of-truth, batch closure, and non-blocking execution policy.
---

When working in a project with batch execution rules:

1. Treat actual code state as the highest source of truth
2. Prefer progress over abstract replanning
3. Do not reopen CLOSED batches unless regression or a real blocker is found
4. If a meaningful OPEN batch exists, finish it before opening a new one
5. Use `ralplan` before major feature work
6. Use `ralph` for implementation persistence
7. Use `code-review` before closure
8. Batch state machine transitions:
   - NOT STARTED → OPEN: ralplan complete
   - OPEN → REVIEW: ralph complete
   - REVIEW → HARDENING: CRITICAL or HIGH issues found
   - REVIEW → CLOSED: CRITICAL=0, HIGH=0, close pass passed
   - HARDENING → REVIEW: after hardening, re-review
   - CLOSED → do not reopen
9. A batch is CLOSED only when:
   - implementation exists
   - review was performed
   - hardening happened if needed
   - CRITICAL=0, HIGH=0
   - closure-blocking issues are zero
   - related build/type/test/migration checks passed
10. Keep batch notes human-readable in `tasks/` and current state in `docs/EXECUTION_STATUS.md`
11. Treat `.omc/*` as secondary execution memory, not the official task ledger
12. Update `docs/EXECUTION_STATUS.md` after every batch close
