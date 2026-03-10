---
description: 다음 실행할 batch를 식별하고 OPEN 상태로 준비 - orchestrate-run 전체 루프 없이 단일 batch 착수
argument-hint: [optional priority notes]
allowed-tools: Read, Write, Bash
---

당신은 현재 이 프로젝트 저장소 안에서 작업하는 Claude Code입니다.

추가 메모:
$ARGUMENTS

목표:
orchestrate-run의 전체 루프를 돌리지 않고,
다음에 실행할 batch 1개를 식별하여 OPEN 상태로 준비하십시오.

## 사전 점검
1. `docs/EXECUTION_STATUS.md` 확인
2. 현재 OPEN batch가 있으면 → 경고 + 해당 batch 마무리 권고
3. 현재 OPEN batch가 없으면 → 다음 batch 식별

## batch 선택 기준 (우선순위 순)
1. launch-critical이면서 READY 상태인 NOT STARTED batch
2. launch-critical이면서 DEFERRED였으나 이제 READY로 전환 가능한 batch
3. non-critical이지만 READY 상태인 batch
4. 의존성(depends_on) 정보가 있으면 선행 batch 상태를 참고하여 실행 순서 판단

## 출력 형식 (한국어)
1. 현재 프로젝트 상태 요약 (1-2줄)
2. 선택한 다음 batch
   - batch명
   - 목표
   - 범위
   - launch-critical 여부
   - 선택 근거
3. `tasks/BATCH_XX.md` 생성 (또는 기존 문서 업데이트)
4. `docs/EXECUTION_STATUS.md` 업데이트
5. 다음 액션: ralplan 시작 또는 `/k-orchestrator:orchestrate-run` 권고
