---
description: 상황별 명령 가이드 - 어떤 상황에서 어떤 명령을 사용할지 안내
argument-hint: [optional situation keyword]
allowed-tools: Read
---

당신은 k-orchestrator의 도움말 시스템입니다.

사용자 입력:
$ARGUMENTS

## 동작 방식

사용자가 상황 키워드를 입력한 경우 해당 섹션만 출력하십시오.
키워드 매핑:
- "시작", "새 프로젝트", "처음" → 시나리오 1
- "재개", "이어서", "resume" → 시나리오 2
- "기능", "변경", "요청" → 시나리오 3
- "검증", "정합성", "normalize" → 시나리오 4
- "다음", "batch", "next" → 시나리오 5
- "memory", "기억", "메모리" → 시나리오 6
- "도움", "help", "명령" → 시나리오 7
- "업데이트", "update", "최신" → 시나리오 8
- "대시보드", "현황", "진행", "dashboard", "progress" → 시나리오 9

키워드가 없거나 매칭되지 않으면 전체 가이드를 출력하십시오.

## 전체 가이드 출력 형식 (한국어)

아래 내용을 그대로 출력하십시오:

---

# k-orchestrator 명령 가이드

## 상황별 안내

### 시나리오 1: 새 프로젝트 시작
```
/k-orchestrator:setup-project-suite   ← 저장소 감사 + 구조 bootstrap
         ↓
/k-orchestrator:foundation-pack       ← foundation 문서 세트 생성
         ↓
/k-orchestrator:bootstrap-ops         ← 운영 구조 정렬
         ↓
/k-orchestrator:orchestrate-run       ← batch 기반 자동 실행
```

### 시나리오 2: 세션 재개
```
/k-orchestrator:resume-run            ← 상태 복원 후 자동 실행
```

### 시나리오 3: 새 기능/변경 요청 발생
```
/k-orchestrator:change-impact         ← Type A/B/C 영향 분석
         ↓ (Type B/C인 경우)
/k-orchestrator:make-extension-block  ← extension block 생성
         ↓
/k-orchestrator:orchestrate-run       ← 실행 재개
```

### 시나리오 4: 구조 정합성 검증
```
/k-orchestrator:normalize-repo        ← 파일 구조 검증 및 교정
```

### 시나리오 5: 다음 작업 찾기
```
/k-orchestrator:next-batch            ← 다음 batch 식별 및 OPEN
```

### 시나리오 6: memory 계층 설정
```
/k-orchestrator:setup-memory-layer    ← recall/Obsidian/QMD 설정
```

### 시나리오 7: 도움이 필요할 때
```
/k-orchestrator:help                  ← 이 가이드 (상황 키워드로 필터 가능)
```

### 시나리오 8: 플러그인 업데이트
```
/k-orchestrator:update                ← GitHub에서 최신 버전 확인 및 적용
```

### 시나리오 9: 진행 현황 확인
```
/k-orchestrator:dashboard             ← batch 진행 현황 단일 뷰
```

## 빠른 참조표

| 호출 | 역할 | 사용 시점 |
|---|---|---|
| `/k-orchestrator:setup-project-suite` | 저장소 감사 + 전체 구조 bootstrap | 프로젝트에 처음 적용할 때 |
| `/k-orchestrator:foundation-pack` | foundation 문서 세트 생성 | 새 프로젝트의 PRD/blueprint/schema 필요 시 |
| `/k-orchestrator:bootstrap-ops` | 운영 구조 정렬 | foundation 이후 운영 구조 확정 시 |
| `/k-orchestrator:orchestrate-run` | batch 기반 자동 실행 | 본격 개발 실행 시 |
| `/k-orchestrator:resume-run` | 세션 재개 | 이전 세션 이어서 작업할 때 |
| `/k-orchestrator:change-impact` | 신규 기능 영향 분석 (Type A/B/C) | 새 기능/변경 요청 발생 시 |
| `/k-orchestrator:make-extension-block` | extension block 생성 | change-impact 결과 Type B/C일 때 |
| `/k-orchestrator:setup-memory-layer` | memory 계층 설정 (선택) | recall/Obsidian/QMD 필요 시 |
| `/k-orchestrator:next-batch` | 다음 batch 식별 및 OPEN | 단일 batch만 착수할 때 |
| `/k-orchestrator:normalize-repo` | 파일 구조 정합성 검증 및 교정 | 설치 후 또는 구조 의심 시 |
| `/k-orchestrator:help` | 상황별 명령 가이드 | 어떤 명령을 써야 할지 모를 때 |
| `/k-orchestrator:update` | 플러그인 자체 업데이트 | 새 버전 확인 및 적용 시 |
| `/k-orchestrator:dashboard` | batch 진행 현황 대시보드 | 전체 진행 상태 한눈에 볼 때 |

## 워크플로우 다이어그램

```
                    ┌─────────────────────┐
                    │   프로젝트 시작?      │
                    └──────────┬──────────┘
                         yes   │   no
                    ┌──────────┴──────────┐
                    ▼                     ▼
            setup-project-suite    세션 재개?
                    │              yes │  no
                    ▼                 ▼    ▼
            foundation-pack    resume-run  새 기능?
                    │                      yes │ no
                    ▼                          ▼   ▼
            bootstrap-ops            change-impact  next-batch
                    │                      │        또는
                    ▼                      ▼        normalize-repo
            orchestrate-run      make-extension-block
                                           │
                                           ▼
                                   orchestrate-run
```

---
