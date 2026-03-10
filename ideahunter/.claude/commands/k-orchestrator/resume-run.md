---
description: 세션 재개 - 현재 상태 복원 후 다음 batch 자동 실행
argument-hint: [optional notes]
allowed-tools: Read, Write, Bash, Glob, Grep
---

`CLAUDE.md`, `docs/EXECUTION_STATUS.md`, 미닫힘 batch 문서, 관련 QA 문서를 먼저 읽고 현재 상태를 판정하십시오.

추가 메모:
$ARGUMENTS

## 작업 시작 전 진단
- global `.claude` 재사용형인지
- project-local `.claude` 포함형인지
- 혼합형인지

## 복원 우선순위 (순서대로)
1. `CLAUDE.md` (또는 import된 `docs/CC_ORCHESTRATOR.md`)
2. `docs/EXECUTION_STATUS.md`
3. 현재 OPEN 상태 `tasks/BATCH_*.md`
4. 해당 `qa/BATCH_*_QA.md`
5. 관련 소스 파일 직접 확인
6. (상태 불명확 시에만) 보조 기억 계층 `recall`

## recall 호출 판단
- EXECUTION_STATUS.md가 최신 + OPEN batch 명확 → recall 불필요
- 문서 간 충돌 또는 상태 불명확 → recall 필요
- 주제 전환으로 문맥 복원 필요 → recall 필요
- 매 phase 반복 호출 → 금지

## 상태 복원 시 확인할 것
- 이전 종료 판정(Termination Status)이 있으면 그 맥락부터 복원
- 작업 상태 분류(READY/BLOCKED/DEFERRED/OPTIONAL) 유효성 재확인
- BLOCKED 항목: 실제로 여전히 BLOCKED인지 재검증 (해소되었으면 READY로 전환)

## 실행
1. 상태 복원 후 현재 상태 요약 (한국어, 3-5줄)
2. 이전 Termination Status가 있으면 함께 표시
3. OPEN batch 있으면 → 즉시 orchestrate-run 흐름으로 전환
4. OPEN batch 없으면 → 다음 launch-critical batch 식별 후 실행
5. batch CLOSED 후 필요 시 짧은 boundary note, sync는 batch 경계/SessionEnd에서만

## 종료 시
orchestrate-run과 동일한 2단 Termination Status 선언 필수:
- Primary: ALL_LAUNCH_CRITICAL_DONE / BLOCKED_ON_CRITICAL_PATH / OPEN_BATCH_REMAINS / NEXT_BATCH_READY
- Secondary: 해당하는 것 모두

실제 stop condition에 도달할 때까지 자동 전진하십시오.
