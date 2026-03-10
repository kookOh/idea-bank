# Claude Code Memory & Integration Setup

## Architecture

```
OMC (실행 엔진)  →  recall (세션 복구)  →  sync-claude-sessions (영구 저장)
     ↑                    ↑                         ↓
  .omc/state         JSONL timeline            Obsidian Vault
  .omc/notepad.md    QMD BM25 search         Claude Sessions/
```

## Source of Truth (우선순위)

1. **코드 / DB / 레포 문서** — 항상 최우선
2. **프로젝트 실행 문서** (PRD, ROADMAP 등)
3. **`.omc/*`** — OMC 상태, 프로젝트 메모리
4. **Obsidian / recall 결과** — 보조 메모리

## 컴포넌트 역할

| 컴포넌트 | 역할 | 사용 시점 |
|----------|------|-----------|
| **OMC** | 메인 실행 엔진 (에이전트 오케스트레이션) | 항상 |
| **recall** | 세션 시작 시 컨텍스트 복구, 주제별 검색 | 세션 시작, 특정 기억 필요 시 |
| **sync-claude-sessions** | 세션 → Obsidian 영구 저장 | 세션 종료 시 |
| **`.omc/notepad.md`** | 작업 중 임시 메모 (compaction 방지) | 작업 중 |
| **`.omc/project-memory.json`** | 프로젝트 기술 스택/구조 메모리 | OMC 자동 관리 |

## 설정 구조 (HYBRID)

### Global (`~/.claude/settings.json`)
- OMC 플러그인 (`oh-my-claudecode@omc`)
- recall-skill 플러그인 (`recall-skill@personal-os-skills`)
- 권한 설정, statusLine, 언어 설정
- **수정 금지** — 다른 프로젝트에도 영향

### Project-local (`ideahunter/.claude/`)
- `local.env` — VAULT_DIR, PROJECT_NAME 등 환경변수
- `settings.local.json` — Stop 훅 (세션 종료 시 sync)
- `hooks/` — AIT 도메인 전용 검증 스크립트
- `skills/` — AIT 도메인 전용 스킬
- `scripts/` — session-sync, session-index 스크립트

## 훅 정책

| 이벤트 | 동작 | 이유 |
|--------|------|------|
| **Stop** | session-sync.sh 실행 | 세션 종료 시 Obsidian에 기록 |
| **UserPromptSubmit** | 없음 | 매 프롬프트 sync는 과도한 오버헤드 |
| **PreToolUse/PostToolUse** | OMC 플러그인 훅만 | OMC가 자체 관리 |

## `.omc/notepad.md` 운영 규칙

- **짧고 운영 중심**으로 유지 (세션 아카이브 금지)
- 현재 작업 컨텍스트, 차단 요인, 다음 단계만 기록
- 세션 종료 시 정리 or 삭제
- 장기 기억은 Obsidian/recall로 이관

## 사용법

### 세션 시작 시 컨텍스트 복구
```
/recall-skill:recall "어제 ideahunter 작업"
/recall-skill:recall "프롬프트 생성기 수정"
```

### 세션 종료 시 영구 저장
- 자동: Stop 훅이 session-sync.sh 실행
- 수동: `/recall-skill:sync-claude-sessions`

### QMD 인덱싱 (수동)
```bash
.claude/scripts/session-index.sh
```

### 주제별 검색 (QMD 설정 후)
```
/recall-skill:recall "AIT analyzer 구현"
```

## 환경변수 (`local.env`)

| 변수 | 값 | 설명 |
|------|-----|------|
| `VAULT_DIR` | `/Users/kook/Documents/Obsidian Vault` | Obsidian 볼트 루트 |
| `PROJECT_NAME` | `ideahunter` | 세션 저장 폴더명 |
| `QMD_SESSION_DAYS` | `30` | QMD 검색 범위 (일) |
