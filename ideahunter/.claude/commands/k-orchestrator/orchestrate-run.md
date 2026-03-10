---
description: batch 기반 오케스트레이터 - stop condition 전까지 자동 전진
argument-hint: [PROJECT EXTENSION BLOCK 또는 추가 메모]
allowed-tools: Read, Write, Bash, Glob
---

당신은 이 저장소 내부에서 실행 오케스트레이터로 동작하는 Claude Code입니다.

추가 메모:
$ARGUMENTS

목표:
다음 루프를 반복하면서 프로젝트를 launch readiness 방향으로 전진시키십시오.

## Batch 상태머신 전환 규칙
- NOT STARTED → OPEN: ralplan 완료
- OPEN → REVIEW: ralph 완료
- REVIEW → HARDENING: CRITICAL 또는 HIGH 이슈 발견
- REVIEW → CLOSED: CRITICAL=0, HIGH=0, close pass 통과
- HARDENING → REVIEW: hardening 완료 후 재검토
- CLOSED → 재개봉 금지 (회귀 또는 실제 blocker 확인 필수)
- OPEN/REVIEW → BLOCKED: 외부 의존성 또는 인간 작업 필요

## 작업 상태 분류 규칙
각 작업/항목은 반드시 아래 중 하나로 분류:
- READY: 즉시 실행 가능, 외부 의존 없음
- BLOCKED: 저장소 밖 이유로 진행 불가 (외부 승인, credential, 콘솔 수동작업, 법무/사업 결정, 환경 제약)
- DEFERRED: 의도적으로 미룸 (현재 launch scope 밖, 별도 batch 분리 예정)
- OPTIONAL: nice-to-have, launch 필수 아님

중요:
- 큰 작업(L effort)이라는 이유만으로 BLOCKED로 분류하지 않는다
- "별도 batch로 분리 필요"는 READY 또는 DEFERRED이다
- BLOCKED는 오직 저장소 밖 이유에만 사용한다

## source of truth priority
1. 실제 코드 상태
2. `docs/EXECUTION_STATUS.md`
3. `tasks/BATCH_*.md` 및 `qa/` 문서
4. PRD / BLUEPRINT / ARCHITECTURE / API / SCHEMA 문서
5. 이전 로그

## 시작 요구사항
- 현재 저장소 상태 점검
- OPEN batch 있으면 먼저 마무리
- 보조 기억 계층: global/local/hybrid 진단, `recall`은 상태 불명확 시에만

## 실행 루프
1. `docs/EXECUTION_STATUS.md`에서 현재 활성 batch 확인
2. OPEN batch 있으면 마무리 우선
3. OPEN batch 없으면 다음 NOT STARTED batch 식별
4. `ralplan` 실행
5. `ralph` 실행
6. `code-review` 실행 (CRITICAL/HIGH/MEDIUM/LOW 분류)
7. CRITICAL 또는 HIGH > 0 → HARDENING
8. HARDENING 완료 → REVIEW 재수행
9. CRITICAL=0, HIGH=0, close pass 통과 → CLOSED
10. `docs/EXECUTION_STATUS.md` 업데이트
11. stop condition 미달 시 → 다음 batch 반복

## closure 기준
- 구현 존재 / 리뷰 완료 / hardening 완료(필요 시)
- close pass 완료 / CRITICAL=0 / HIGH=0
- closure-blocking issue 없음

## stop condition
- 필수 third-party credential 부재로 critical path 차단
- 외부 승인/심사 필요
- 저장소 밖 수동 콘솔/UI 작업 필요
- 사업/법무 의사결정 필요
- 모든 launch-critical batch CLOSED

## 종료 판정 (Termination Status)
종료 시 반드시 2단 구조로 선언:

Primary (1개 선택):
- ALL_LAUNCH_CRITICAL_DONE: 모든 launch-critical batch CLOSED
- BLOCKED_ON_CRITICAL_PATH: critical path에 외부 blocker 존재
- OPEN_BATCH_REMAINS: 미완료 OPEN batch 존재, 계속 가능
- NEXT_BATCH_READY: 현재 batch CLOSED, 다음 batch 시작 가능

Secondary (해당하는 것 모두):
- NON_CRITICAL_BATCHES_READY
- DEFERRED_WORK_REMAINS
- SOME_FEATURES_BLOCKED_EXTERNALLY
- EXTERNAL_TASKS_PENDING
- HANDOFF_READY
- SAFE_PARALLEL_WORK_REMAINS

## 최종 보고 요구사항 (한국어)
1. 완료한 batch 목록
2. 생성/수정된 파일
3. 도달한 blocker (BLOCKED 상태만 — L effort 작업은 BLOCKED 아님)
4. 현재 프로젝트 상태
5. Termination Status (Primary + Secondary)
6. 다음 재개 batch
7. 사람이 해야 할 작업
8. 병렬로 계속 가능한 안전한 작업
9. DEFERRED/OPTIONAL 작업 목록 (있을 경우)

[PROJECT EXTENSION BLOCK GOES HERE]
