---
description: 현재 저장소를 감사하고 k-orchestrator 운영 구조를 안전하게 적용하는 전체 bootstrap 진입점
argument-hint: [optional notes]
allowed-tools: Read, Write, Bash, Glob
---

당신은 현재 이 프로젝트 저장소 안에서 작업하는 Claude Code입니다.

추가 메모:
$ARGUMENTS

목표:
이 저장소에 k-orchestrator 운영 구조를 안전하게 적용하십시오.

## 반드시 점검할 항목
1. OMC 설치/사용 여부 (`which omc` 또는 `.omc/` 디렉토리 유무)
2. personal-os-skills 사용 가능 여부
3. 기존 `CLAUDE.md` 존재 여부 및 내용
4. `docs/CC_ORCHESTRATOR.md` 존재 여부
5. `docs/PROJECT_FOUNDATION.md` 존재 여부
6. `docs/EXECUTION_STATUS.md` 존재 여부
7. `tasks/` 및 `qa/` 구조 존재 여부
   - `tasks/BATCH_TEMPLATE.md` 존재 확인
   - `qa/BATCH_TEMPLATE_QA.md` 존재 확인
8. `.omc/` 존재 여부 및 notepad.md 크기
9. `.claude/commands/k-orchestrator/` 존재 여부
10. `.claude/skills/k-orchestrator/` 존재 여부 (policy skills 설치 확인)
11. `.claude/settings.local.json` 존재 여부 (hooks)
12. `.claude/settings.json` 존재 여부 (permissions)
13. Obsidian 또는 QMD 사용 여부
14. global `.claude` / project-local `.claude` / hybrid 판정

## 처리 규칙
- 기존 OMC `CLAUDE.md`는 절대 덮어쓰지 않음
- `CLAUDE.md`가 있으면 `@path` import 방식으로만 확장
- 없으면 새로 생성하되 기존 구조 먼저 진단
- 다음 파일이 없으면 생성:
  - `docs/CC_ORCHESTRATOR.md`
  - `docs/EXECUTION_STATUS.md`
  - `tasks/BATCH_TEMPLATE.md` (tasks/ 디렉토리에 위치)
  - `qa/BATCH_TEMPLATE_QA.md` (qa/ 디렉토리에 위치)
- `docs/PROJECT_FOUNDATION.md`가 없으면 placeholder 생성 + Foundation Pack 필요 여부 명시
- OMC agent 역할명 (planner/architect/executor/verifier) 중복 정의 금지
- `docs/PLUGIN_DIAGNOSTIC.md` 생성 — 진단 결과를 기록

## skills 설치 확인
- `.claude/skills/k-orchestrator/batch-execution-policy/SKILL.md` 존재 확인
- `.claude/skills/k-orchestrator/memory-layer-policy/SKILL.md` 존재 확인
- 누락 시 install.sh 재실행 또는 수동 복사 안내

## 반드시 판정
- GLOBAL / LOCAL / HYBRID 여부
- OMC + personal-os-skills 준비 상태
- memory bootstrap 필요 여부
- 작업 상태 분류 (READY/BLOCKED/DEFERRED/OPTIONAL) 초기 판정

## 출력 형식 (한국어)
1. 현재 상태 진단
2. 적용/생성한 파일 목록
3. skills 설치 상태
4. 남은 수동 작업
5. 바로 다음 액션 (1개 명확한 권고)
