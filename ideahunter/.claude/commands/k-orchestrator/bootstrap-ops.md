---
description: 저장소 상태를 분류하고 batch 기반 운영 모델로 부트스트랩
argument-hint: [optional notes]
allowed-tools: Read, Write, Bash, Glob
---

당신은 OMC가 설치되어 있을 수도 있고, 프로젝트 문서가 일부 존재할 수도 있는 저장소 내부에서 작업하는 Claude Code입니다.

추가 메모:
$ARGUMENTS

목표:
이 저장소를 실행 가능한 운영 상태로 bootstrap 하십시오.

## 저장소 상태 분류
- STATE_0: 아이디어만 있음
- STATE_1: 문서만 있음
- STATE_2: scaffold만 있음
- STATE_3: 일부 구현됨
- STATE_4: batch 기반 구현 진행 중
- STATE_5: launch hardening / release 단계

## 점검 요구사항
- `docs/`, `tasks/`, `qa/`, `app/` 또는 `src/`
- `package.json` 또는 package manifest
- `schema/`, `migrations/`, DB 관련 경로
- api-spec 관련 파일
- `CLAUDE.md`, `docs/EXECUTION_STATUS.md`, `docs/ARCHITECTURE.md`
- `tests/` 관련 디렉토리

## source of truth 정책
1. 실제 코드 상태
2. 최신 execution status 문서
3. batch / task 문서
4. PRD / blueprint / architecture / routes / api / schema 문서
5. 이전 로그 또는 요약

## 작업 상태 분류 규칙
식별된 모든 작업을 다음으로 분류:
- READY: 즉시 실행 가능, 코드 변경으로 해결 가능
- BLOCKED: 저장소 밖 이유로 진행 불가 (외부 승인, credential, 콘솔 수동작업, 법무/사업 결정)
- DEFERRED: 현재 launch scope 밖, 별도 batch 분리 예정
- OPTIONAL: nice-to-have, launch 필수 아님

중요: 큰 작업이라는 이유만으로 BLOCKED 분류 금지

## 운영 모델 정의
- 언제 `ralplan` / `ralph` / `code-review`를 써야 하는지
- batch 추적 및 closure 기록 방식
- launch-critical 판정 방식
- `.omc/*`, `recall`, `sync-claude-sessions`, Obsidian/QMD는 secondary memory로만 분류
- global `.claude` / project-local `.claude` / hybrid 진단 및 중복 방지

## 출력 형식 (한국어)
1. 현재 상태 판정 (STATE_0 ~ STATE_5)
2. source of truth 규칙
3. 운영 모델
4. 작업 상태 분류표 (READY / BLOCKED / DEFERRED / OPTIONAL)
5. 누락 문서/구조 목록
6. bootstrap 완료 작업
7. 다음 단계: `/k-orchestrator:orchestrate-run` 실행 권고
