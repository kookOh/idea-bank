# CC_ORCHESTRATOR.md

## 역할
- 이 저장소에서 Claude Code는 실행 보조자이자 batch 기반 오케스트레이터로 동작한다
- 목표는 분석보다 실제 구현 진전과 launch readiness 달성이다

## 핵심 원칙
- source of truth를 우선 확인한다
- 추상적 재기획보다 실제 구현 진전을 우선한다
- 이미 CLOSED 된 batch는 회귀나 실제 blocker가 없는 한 다시 열지 않는다
- 모든 의미 있는 구현 batch는 review / hardening / close 단계를 거친다
- launch-oriented 상태를 유지한다
- 세션이 바뀌어도 실행 재개가 가능해야 한다

## source of truth priority
1. 현재 저장소의 실제 코드 상태
2. docs/EXECUTION_STATUS.md
3. tasks/BATCH_*.md 및 qa/ 문서
4. PRD / BLUEPRINT / ARCHITECTURE / API / SCHEMA 문서
5. 이전 실행 로그

## 작업 상태 분류 (Task Status)

각 작업(task/batch item)은 반드시 다음 중 하나의 상태를 가진다:

| 상태 | 의미 | 판정 기준 |
|---|---|---|
| READY | 즉시 실행 가능 | 외부 의존 없음, 코드 변경으로 해결 가능 |
| BLOCKED | 저장소 밖 이유로 진행 불가 | 외부 승인, credential, 콘솔 수동작업, 법무/사업 결정, 환경 제약 |
| DEFERRED | 의도적으로 뒤로 미룸 | 현재 launch scope에 불필요, 별도 batch로 분리 예정 |
| OPTIONAL | 있으면 좋지만 launch에 필수 아님 | nice-to-have, 시간 여유 시 처리 |

중요 규칙:
- 큰 작업(L effort, large scope)이라는 이유만으로 BLOCKED로 분류하지 않는다
- "별도 batch로 분리 필요"는 READY 또는 DEFERRED이다
- BLOCKED는 오직 저장소 밖 이유(외부 승인, 크리덴셜, 콘솔 수동작업, 법무/사업 결정, 환경 제약)에만 사용한다
- 상태 판정 시 반드시 근거를 한 줄 이상 명시한다

## 종료 판정 체계 (Termination Status)

오케스트레이션 종료 시 반드시 2단 구조로 선언한다:

### Primary termination status (반드시 1개 선택)
| 상태 | 의미 |
|---|---|
| ALL_LAUNCH_CRITICAL_DONE | 모든 launch-critical batch가 CLOSED |
| BLOCKED_ON_CRITICAL_PATH | critical path에 외부 blocker 존재 |
| OPEN_BATCH_REMAINS | 미완료 OPEN batch 존재, 계속 가능 |
| NEXT_BATCH_READY | 현재 batch CLOSED, 다음 batch 시작 가능 |

### Secondary status (해당하는 것 모두 선택)
| 상태 | 의미 |
|---|---|
| NON_CRITICAL_BATCHES_READY | launch 필수는 아니지만 실행 가능한 batch 존재 |
| DEFERRED_WORK_REMAINS | 의도적으로 미룬 작업 존재 |
| SOME_FEATURES_BLOCKED_EXTERNALLY | 일부 기능이 외부 blocker로 중단 |
| EXTERNAL_TASKS_PENDING | 인간이 수행해야 할 외부 작업 존재 |
| HANDOFF_READY | 다른 사람/팀에게 인수 가능 상태 |
| SAFE_PARALLEL_WORK_REMAINS | 인간 작업 없이 병렬 진행 가능한 작업 존재 |

## Batch 상태머신 전환 규칙
- NOT STARTED → OPEN: ralplan 완료
- OPEN → REVIEW: ralph 완료
- REVIEW → HARDENING: CRITICAL 또는 HIGH 이슈 발견
- REVIEW → CLOSED: CRITICAL=0, HIGH=0, close pass 통과
- HARDENING → REVIEW: hardening 완료 후 재검토
- CLOSED → 재개봉 금지 (회귀 또는 실제 blocker 확인 필수)
- OPEN/REVIEW → BLOCKED: 외부 의존성 또는 인간 작업 필요

## OMC 충돌 해소 원칙
- OMC가 제공하는 planner/architect/executor/verifier agent와 같은 역할명을
  project-local `.claude/agents/`에 재정의하지 않는다
- k-orchestrator commands는 OMC command와 같은 이름을 사용하지 않는다
- project-local subagent 정의가 global보다 우선하므로, 이름 겹침은 OMC 동작을 무력화한다

## 보조 기억 계층 규칙 (선택적)
- `.omc/*`, `recall`, `sync-claude-sessions`, Obsidian/QMD 기반 기록은 보조 기억 계층으로만 사용한다
- 항상 코드와 repo 문서를 최우선 source of truth로 삼고, 보조 기억 결과로 기존 코드 판단을 덮어쓰지 않는다
- 외부 기억 계층을 사용하는 프로젝트에서도 영구 운영 규칙은 이 문서에 두고, 현재 상태는 `docs/EXECUTION_STATUS.md`에 둔다
- `VAULT_DIR`를 사용하는 경우 프로젝트 `docs/` 폴더가 아니라 실제 Obsidian vault 루트의 절대경로를 사용한다
- 보조 기억 계층이 아직 설정되지 않았고 장기 세션 재개성이 중요한 프로젝트라면, 별도의 memory bootstrap 절차를 통해 설정한다

## 시작 시 우선 확인할 경로
- `docs/`, `tasks/`, `qa/`
- `app/` 또는 `src/`
- `package.json`
- `schema/`, `migrations/`, DB 관련 디렉토리
- api-spec 관련 파일
- `tests/` 관련 디렉토리
- 현재 batch 상태 문서

## 작업 크기별 운영 방식

### Tiny task
- 오타 수정, 간단한 문구 수정, 작은 스타일 수정
- 일반 모드로 처리 가능, batch 오케스트레이션 불필요

### Feature task
- 기능 추가, 라우트 추가, API 수정, 스키마 수정
- `ralplan` → `ralph` → `code-review` 권장
- batch 문서 업데이트 필요

### Launch-critical task
- 인증, 결제, 권한, 데이터 무결성, 배포 준비, SEO 코어 구조
- 반드시 batch 기반으로 수행
- `ralplan` → `ralph` → `code-review` → hardening → close
- EXECUTION_STATUS와 batch 문서 업데이트 필수

## recall / sync 사용 원칙
- `recall`은 세션 시작 시 상태가 불명확할 때, 실제 blocker가 있을 때, 또는 주제 전환으로 문맥 복원이 필요할 때만 호출한다
- 매 phase마다 `recall`을 반복 호출하지 않는다
- sync는 기본적으로 SessionEnd 또는 batch 경계에서만 수행한다
- `UserPromptSubmit`마다 자동 sync를 수행하지 않는다
- QMD/Obsidian 인덱스는 SessionEnd 또는 수동 maintenance 시점에만 갱신한다
- `.omc/notepad.md`에는 active batch, current blocker, next action만 짧게 유지하고 긴 세션 로그는 넣지 않는다

## batch 규칙
- 하나의 batch는 충분히 작아서 review 후 close 가능해야 한다
- partially implemented batch가 있으면 새 batch보다 먼저 마무리한다
- close 기준:
  - 구현 존재
  - 리뷰 수행
  - 필요 시 hardening 수행
  - close pass 수행
  - CRITICAL/HIGH = 0
  - 관련 build/type/test/migration check 통과
  - closure-blocking issue = 0

## 문서 업데이트 규칙
- 실행 상태: docs/EXECUTION_STATUS.md
- batch 계획/상태: tasks/BATCH_*.md
- QA 및 review 결과: qa/BATCH_*_QA.md
- 아키텍처 변경: docs/ARCHITECTURE.md
- 장기 기준: PRD / BLUEPRINT

## 금지사항
- source of truth 확인 없이 구조를 추정하지 않는다
- 무한한 폴리싱 루프에 빠지지 않는다
- 외부 승인/크리덴셜이 필요한 영역을 임의로 완료 처리하지 않는다
- provider-specific lock-in을 불필요하게 강화하지 않는다
- 세션 종료 전에 상태 문서 갱신 없이 끝내지 않는다
- 큰 작업이라는 이유만으로 BLOCKED로 분류하지 않는다
- 종료 시 termination status 없이 종료하지 않는다

## 재개 규칙
- 새 세션이 시작되면 먼저 `CLAUDE.md`, `docs/EXECUTION_STATUS.md`, 미닫힘 batch 문서를 확인한다
- 미닫힘 batch가 있으면 그것부터 이어서 닫는다
- blocker가 생기면 blocker report를 남기고, 병렬로 가능한 안전한 작업이 있으면 계속 진행한다
