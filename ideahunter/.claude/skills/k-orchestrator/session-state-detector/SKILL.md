---
name: session-state-detector
description: 세션 시작 시 프로젝트 오케스트레이션 상태를 자동 감지하여 구조화된 요약을 제공. resume-run 수동 호출을 대체.
---

세션이 시작되거나 프로젝트 상태 파악이 필요할 때:

1. `docs/EXECUTION_STATUS.md`를 읽고 현재 상태를 파악한다
2. 현재 OPEN 상태인 `tasks/BATCH_*.md` 파일을 확인한다
3. 아래 구조화된 요약을 한국어로 제공한다:

## 상태 요약 형식

```
── k-orchestrator 상태 감지 ──
프로젝트 상태: [STATE_0~STATE_5]
활성 batch: [batch명 또는 "없음"]
Batch 상태: [NOT STARTED / OPEN / REVIEW / HARDENING / BLOCKED]
Launch-critical 진척: [CLOSED 수]/[전체 수]
마지막 종료 판정: [Primary termination status]
다음 권장 액션: [구체적 명령 또는 작업]
```

## 판정 규칙
- EXECUTION_STATUS.md가 없으면 → "k-orchestrator 미설정. `/k-orchestrator:setup-project-suite` 실행 권장"
- OPEN batch 있으면 → "활성 batch 계속: `/k-orchestrator:orchestrate-run`"
- OPEN batch 없고 NOT STARTED 있으면 → "다음 batch 시작: `/k-orchestrator:next-batch`"
- 모든 launch-critical CLOSED → "launch-critical 완료. non-critical 또는 DEFERRED 작업 확인"
- BLOCKED 항목 있으면 → blocker 내용 함께 표시

## 제약
- 읽기 전용: 어떤 파일도 수정하지 않는다
- EXECUTION_STATUS.md와 tasks/ 파일만 참조한다
- .omc/* 는 참조하지 않는다 (source of truth 우선순위 준수)
