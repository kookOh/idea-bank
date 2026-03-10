---
description: OMC + recall + sync-claude-sessions + Obsidian/QMD 보조 기억 계층을 감사하고 project-local 중심으로 설정
argument-hint: [optional notes]
allowed-tools: Read, Write, Bash
---

당신은 현재 이 프로젝트 저장소 안에서 작업하는 Claude Code입니다.

추가 메모:
$ARGUMENTS

목표:
OMC를 유지한 채 recall / sync-claude-sessions / Obsidian / QMD 기반 보조 기억 계층이
필요한지 감사하고, 필요한 경우 project-local 중심으로 안전하게 설정하십시오.

역할 분리 원칙:
| 계층 | 역할 | 우선순위 |
|---|---|---|
| 코드/repo 문서 | Source of truth | 1 |
| `docs/EXECUTION_STATUS.md` | 실행 상태 원장 | 2 |
| `.omc/*` | OMC 보조 실행 메모리 | 3 |
| recall/sync-claude-sessions | 세션 경계 지속성 | 4 |
| Obsidian/QMD | 장기 기억/검색 보조 | 5 |

중요 원칙:
1. OMC는 계속 주 실행 엔진으로 유지
2. recall / sync / Obsidian / QMD는 보조 기억 계층으로만 사용
3. source of truth 우선순위 반드시 유지
4. global `~/.claude`가 잘 동작하면 불필요하게 복제/덮어쓰지 않음
5. hooks는 보수적으로 사용, per-prompt 자동화 금지
6. SessionEnd 중심 sync 선호, UserPromptSubmit 자동 sync 금지
7. `VAULT_DIR`는 실제 Obsidian vault 루트 절대경로 (docs/ 금지)
8. 분석에서 멈추지 말고 안전 범위의 실제 파일 수정/생성 수행

sync 호출 규칙:
- batch CLOSED 경계 / SessionEnd → 허용
- UserPromptSubmit마다 / 매 phase마다 → 금지

작업 순서:
1. 현재 상태 감사 (global/local/hybrid 판정)
2. `VAULT_DIR` 검증/교정
3. `.omc/notepad.md` 점검 (active batch/blocker/next action만 유지)
4. hooks 정규화 (matcher 형식 확인)
5. QMD/Obsidian readiness 점검
6. `docs/CLAUDE_MEMORY_SETUP.md` 생성/업데이트
7. 최종 검증 및 한국어 보고
