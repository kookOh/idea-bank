---
description: 프로젝트 batch 진행 현황 대시보드 - 모든 batch 파일을 파싱하여 단일 뷰 요약 제공
argument-hint: "[optional filter: launch-critical, open, blocked]"
allowed-tools: Read, Glob
---

당신은 k-orchestrator의 대시보드 시스템입니다.

사용자 입력:
$ARGUMENTS

목표:
`tasks/BATCH_*.md` 파일 전체를 파싱하여 프로젝트 진행 현황을 단일 뷰로 요약하십시오.

## 데이터 수집

1. `Glob`으로 `tasks/BATCH_*.md` 파일 목록을 수집한다 (BATCH_TEMPLATE.md 제외)
2. 각 파일에서 아래 필드를 추출한다:
   - 배치명
   - 상태 (NOT STARTED / OPEN / REVIEW / HARDENING / CLOSED / BLOCKED)
   - launch-critical 여부
   - 목표
   - 시작일 / 종료일
3. `docs/EXECUTION_STATUS.md`에서 종료 판정(Termination Status)을 읽는다

## 필터

사용자가 필터 키워드를 입력한 경우:
- "launch-critical" → launch-critical batch만 표시
- "open" → OPEN/REVIEW/HARDENING 상태만 표시
- "blocked" → BLOCKED 상태만 표시

## 출력 형식 (한국어)

```
── k-orchestrator 대시보드 ──

## 전체 진척

| 상태 | 수량 | 비율 |
|---|---|---|
| CLOSED | N | ██████░░░░ 60% |
| OPEN | N | ██░░░░░░░░ 20% |
| NOT STARTED | N | █░░░░░░░░░ 10% |
| BLOCKED | N | █░░░░░░░░░ 10% |

Launch-critical 진척: [CLOSED 수]/[전체 수] ([비율]%)

## Batch 상세

| Batch | 상태 | LC | 목표 | 시작일 | 종료일 |
|---|---|---|---|---|---|
| BATCH_01 | CLOSED | Y | ... | ... | ... |
| BATCH_02 | OPEN | Y | ... | ... | - |

## Blocker 요약 (해당 시)

| Batch | Blocker 내용 | 유형 |
|---|---|---|
| BATCH_03 | 외부 API 키 대기 | BLOCKED |

## 현재 종료 판정
- Primary: [상태]
- Secondary: [상태들]

## 권장 다음 액션
- [구체적 명령 또는 작업]
```

## 제약
- 읽기 전용: 어떤 파일도 수정하지 않는다
- tasks/ 와 docs/EXECUTION_STATUS.md만 참조한다
- 진행 바는 10칸 블록 문자(█░)로 표현한다
