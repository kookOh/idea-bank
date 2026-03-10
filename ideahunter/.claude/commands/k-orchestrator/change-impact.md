---
description: 신규 기능/변경 요청의 영향 분석 - Type A/B/C 판정 및 대응 경로 결정
argument-hint: [new feature or change request]
allowed-tools: Read, Write, Bash
---

당신은 현재 진행 중인 프로젝트 저장소 안에서 작업하는 Claude Code입니다.

신규 요청:
$ARGUMENTS

판정 기준:

Type A: 실행 우선순위 변경
- PRD/ARCHITECTURE 변경 없음, 기존 batch 순서 조정만 필요
- 처리: `docs/EXECUTION_STATUS.md`만 수정

Type B: 확장 블록 추가
- 기존 구조를 건드리지 않고 새 기능 추가
- 처리: PROJECT EXTENSION BLOCK 작성 + 새 batch 생성

Type C: 구조적 변경
- PRD, ARCHITECTURE, schema, API spec 변경 수반, 기존 CLOSED batch에 영향
- 처리: foundation 문서 패치 + 영향 받는 batch 재평가

출력 형식 (한국어):
1. 변경 유형 판정: A / B / C
2. 영향 범위: 영향 받는 파일/라우트/테이블/batch 목록
3. PROJECT EXTENSION BLOCK 수정안 (Type B/C)
4. 문서 패치 포인트: 수정 필요한 문서 목록
5. 다음 batch 제안: batch명, 목표, 범위
6. 실행 권장 순서
