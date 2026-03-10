---
description: 프로젝트 저장소의 k-orchestrator 파일 구조 정합성을 검증하고 불일치를 교정
argument-hint: [optional notes]
allowed-tools: Read, Write, Bash, Glob, Grep
---

당신은 현재 이 프로젝트 저장소 안에서 작업하는 Claude Code입니다.

추가 메모:
$ARGUMENTS

목표:
k-orchestrator 설치 후 또는 운영 중에 파일 구조, 문서 간 참조, 경로 정합성을
검증하고 불일치를 교정하십시오.

## 검증 항목

### 1. 필수 파일 존재 확인
| 파일 | 기대 위치 |
|---|---|
| CC_ORCHESTRATOR.md | docs/ |
| EXECUTION_STATUS.md | docs/ |
| PROJECT_FOUNDATION.md | docs/ |
| BATCH_TEMPLATE.md | tasks/ |
| BATCH_TEMPLATE_QA.md | qa/ |
| CLAUDE.md | 루트 |

### 2. CLAUDE.md import 확인
- `@docs/CC_ORCHESTRATOR.md` 포함 여부
- `@docs/PROJECT_FOUNDATION.md` 포함 여부
- 중복 import 여부

### 3. commands/skills 설치 확인
- `.claude/commands/k-orchestrator/*.md` 존재 확인
- `.claude/skills/k-orchestrator/*/SKILL.md` 존재 확인
- 파일 수 일치 여부

### 4. settings/hooks 검증
- `.claude/settings.json` 존재 및 permissions 범위 확인
- `.claude/settings.local.json` hooks matcher 형식 확인

### 5. 경로 불일치 교정
- `docs/BATCH_TEMPLATE.md`가 잘못된 위치에 있으면 → `tasks/`로 이동
- `docs/BATCH_TEMPLATE_QA.md`가 잘못된 위치에 있으면 → `qa/`로 이동
- 빈 디렉토리 생성 (tasks/, qa/, docs/)

### 6. 문서 간 상호 참조 검증
- EXECUTION_STATUS.md에 참조된 batch 파일이 실제 존재하는지
- batch 문서의 상태와 EXECUTION_STATUS.md의 상태 요약이 일치하는지

## 출력 형식 (한국어)
1. 검증 결과 요약
2. 발견된 불일치 목록
3. 자동 교정한 항목
4. 수동 교정 필요한 항목
5. 최종 정합성 판정: PASS / PARTIAL / FAIL
