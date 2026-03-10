---
description: 현재 source of truth 기준으로 PROJECT EXTENSION BLOCK 완성본 생성
argument-hint: [feature, constraint, priority notes]
allowed-tools: Read, Write, Bash
---

현재 source of truth 문서와 실행 상태를 기준으로,
이번 요청을 반영한 PROJECT EXTENSION BLOCK 완성본을 작성하십시오.

추가 메모:
$ARGUMENTS

반드시 함께 판단:
- 확장 블록만으로 충분한지 vs PRD/ARCHITECTURE 패치 필요한지
- `docs/EXECUTION_STATUS.md` 수정이 필요한지
- `tasks/BATCH_XX.md`를 새로 열어야 하는지
- `docs/ARCHITECTURE.md` 또는 PRD 수정이 필요한지

출력 형식 (한국어):
1. 변경 유형 판정 (확장 블록 충분 / 구조 변경 필요)
2. PROJECT EXTENSION BLOCK 완성본
3. 같이 수정해야 할 문서 목록
4. 다음 batch 제안
