# PLUGIN_DIAGNOSTIC.md

## 진단 일시
- 2026-03-10

## 저장소 유형
- [ ] GLOBAL (global ~/.claude 재사용)
- [ ] LOCAL (project-local .claude 포함)
- [x] HYBRID (혼합형)

## 점검 결과

### OMC
- 설치 여부: 설치됨 (`/Users/kook/.bun/bin/omc`)
- `.omc/` 디렉토리 존재 여부: 있음
- `.omc/notepad.md` 크기 상태: 없음 (정상 — 운영 시에만 생성)

### personal-os-skills
- 설치 여부: 설치됨 (글로벌 플러그인)
- 버전: recall-skill@personal-os-skills

### CLAUDE.md
- 존재 여부: 있음 (install.sh로 생성)
- import 추가 여부:
  - @docs/CC_ORCHESTRATOR.md: 포함
  - @docs/PROJECT_FOUNDATION.md: 포함

### 핵심 문서 존재 여부
| 파일 | 존재 | 비고 |
|---|---|---|
| docs/CC_ORCHESTRATOR.md | O | 템플릿 생성 |
| docs/EXECUTION_STATUS.md | O | 템플릿 생성 (초기 상태 기록 필요) |
| docs/PROJECT_FOUNDATION.md | O | placeholder (foundation-pack 필요) |
| tasks/ | O | BATCH_TEMPLATE.md 포함 |
| qa/ | O | BATCH_TEMPLATE_QA.md 포함 |

### skills / commands
| 항목 | 존재 | 비고 |
|---|---|---|
| .claude/skills/k-orchestrator/batch-execution-policy | O | SKILL.md |
| .claude/skills/k-orchestrator/memory-layer-policy | O | SKILL.md |
| .claude/skills/k-orchestrator/session-state-detector | O | SKILL.md |
| .claude/commands/k-orchestrator/ | O | 13개 command |
| .claude/skills/ait-* | O | 기존 AIT 도메인 스킬 3개 유지 |

### Memory 계층
- recall 설정 여부: 글로벌 플러그인으로 활성
- sync-claude-sessions 설정 여부: Stop 훅 + 스크립트 설정 완료
- Obsidian/QMD 설정 여부: QMD 설치됨, 컬렉션 미생성 (선택)
- VAULT_DIR 유효성: 유효 (`/Users/kook/Documents/Obsidian Vault`)

### .claude/settings.local.json (hooks)
- 존재 여부: 있음
- matcher 형식 준수 여부: 준수 (빈 문자열 matcher)
- 훅 목록: SessionStart, PreCompact, Stop (session-sync + k-orchestrator)

## 판정
- OMC 상태: 정상
- memory bootstrap 필요 여부: 불필요 (기본 설정 완료)
- 이슈 목록:
  1. PROJECT_FOUNDATION.md가 placeholder — foundation-pack 실행 필요
  2. EXECUTION_STATUS.md 초기 상태 미기록
  3. QMD 컬렉션 미생성 (선택)

## 다음 권고 액션
- `/k-orchestrator:foundation-pack` 실행하여 PROJECT_FOUNDATION.md 채우기
