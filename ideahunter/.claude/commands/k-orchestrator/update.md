---
description: k-orchestrator 플러그인 자체 업데이트 - GitHub에서 최신 버전을 가져와 안전하게 적용
argument-hint: [--check 확인만 | --force 수정 파일 포함 강제 적용]
allowed-tools: Read, Bash, Glob
---

당신은 k-orchestrator의 업데이트 시스템입니다.

사용자 입력:
$ARGUMENTS

## 업데이트 절차

아래 단계를 순서대로 수행하십시오. 모든 출력은 한국어로 작성합니다.

### Phase 1: 확인 (Check)

#### 1-1. 현재 버전 확인

플러그인 소스 디렉토리를 찾으십시오:
- 이 명령 파일이 위치한 디렉토리의 상위로 올라가 `.claude-plugin/plugin.json`을 찾는다
- 해당 파일에서 `version` 필드를 읽는다

현재 버전을 기록하십시오.

#### 1-2. 원격 최신 버전 확인

임시 디렉토리에 최신 소스를 클론하십시오:

```bash
TEMP_DIR="/tmp/k-orchestrator-update-$(date +%s)"
git clone --depth 1 https://github.com/kookOh/k-orchestrator.git "$TEMP_DIR"
```

`$TEMP_DIR/.claude-plugin/plugin.json`에서 `version` 필드를 읽으십시오.

#### 1-3. 버전 비교

두 버전을 semver 문자열로 비교하십시오 (major.minor.patch 순서).

- 현재 >= 원격: "최신 버전입니다 (현재: X.Y.Z)" 출력 후 임시 디렉토리 정리하고 종료
- 현재 < 원격: 계속 진행

#### 1-4. 변경 사항 요약

원격 소스에서 아래 정보를 수집하여 표시하십시오:

1. **CHANGELOG.md 차이**: 현재 버전 이후 추가된 모든 항목
2. **새로 추가된 파일**: 원격에만 있는 파일 목록
3. **변경된 파일**: 양쪽에 존재하지만 내용이 다른 파일 목록
4. **삭제된 파일**: 로컬에만 있는 파일 (참고용, 삭제하지 않음)

출력 형식:
```
── k-orchestrator 업데이트 확인 ──
현재 버전: X.Y.Z
최신 버전: A.B.C

[변경 내역]
(CHANGELOG 해당 구간 발췌)

[새로 추가된 파일]
- commands/new-command.md
- ...

[변경된 파일]
- install.sh
- ...

[사용자 수정 감지 파일] (해당 시)
- docs/CC_ORCHESTRATOR.md (스킵 예정)
- ...
```

#### 1-5. 사용자 수정 파일 감지 (best-effort)

설치 대상 프로젝트에서 업데이트될 각 파일에 대해:

1. 사용자 프로젝트의 현재 파일 내용을 읽는다
2. 원격(NEW) 버전의 해당 템플릿 내용을 읽는다
3. 로컬 플러그인(OLD) 버전의 해당 템플릿 내용을 읽는다

판정:
- 사용자 파일 == OLD 템플릿 → 사용자 미수정 → 안전하게 업데이트 가능
- 사용자 파일 != OLD 템플릿 AND 사용자 파일 != NEW 템플릿 → 사용자 수정됨 → 스킵 (--force 시에만 덮어쓰기)
- 사용자 파일 == NEW 템플릿 → 이미 최신 → 스킵
- OLD 템플릿이 없음 (신규 파일) → 새로 추가

`$ARGUMENTS`에 `--check`가 포함되어 있으면 여기서 결과만 보여주고 종료하십시오.

### Phase 2: 적용 (Apply)

`--check`가 아닌 경우에만 이 단계를 실행합니다.

#### 2-1. install.sh --update 실행

원격에서 클론한 임시 디렉토리의 `install.sh`를 `--update` 플래그로 실행하십시오:

```bash
bash "$TEMP_DIR/install.sh" --update "$TARGET_PROJECT_DIR"
```

여기서 `$TARGET_PROJECT_DIR`은 현재 작업 중인 프로젝트의 루트 디렉토리입니다.

`$ARGUMENTS`에 `--force`가 포함되어 있으면:
```bash
bash "$TEMP_DIR/install.sh" --update --force "$TARGET_PROJECT_DIR"
```

#### 2-2. 플러그인 소스 자체 업데이트

플러그인 소스 디렉토리(PLUGIN_ROOT)의 파일도 업데이트하십시오:
- `$TEMP_DIR`의 commands/, skills/, templates/, .claude-plugin/ 내용을 PLUGIN_ROOT에 복사
- install.sh 자체도 복사

```bash
cp -R "$TEMP_DIR/commands/" "$PLUGIN_ROOT/commands/"
cp -R "$TEMP_DIR/skills/" "$PLUGIN_ROOT/skills/"
cp -R "$TEMP_DIR/templates/" "$PLUGIN_ROOT/templates/"
cp -R "$TEMP_DIR/.claude-plugin/" "$PLUGIN_ROOT/.claude-plugin/"
cp "$TEMP_DIR/install.sh" "$PLUGIN_ROOT/install.sh"
cp "$TEMP_DIR/CHANGELOG.md" "$PLUGIN_ROOT/CHANGELOG.md"
cp "$TEMP_DIR/README.md" "$PLUGIN_ROOT/README.md"
```

### Phase 3: 결과 보고

아래 형식으로 결과를 출력하십시오:

```
── k-orchestrator 업데이트 완료 ──
이전 버전: X.Y.Z
현재 버전: A.B.C

[추가된 파일]
- (목록)

[업데이트된 파일]
- (목록)

[스킵된 파일 (사용자 수정)]
- (목록, 해당 시)

[변경 내역]
(CHANGELOG 발췌)
```

### Phase 4: 정리

임시 디렉토리를 삭제하십시오:

```bash
rm -rf "$TEMP_DIR"
```

## 오류 처리

- git clone 실패: "원격 저장소에 접근할 수 없습니다. 네트워크 연결을 확인하십시오." 출력
- plugin.json 없음: "플러그인 메타데이터를 찾을 수 없습니다. 설치 상태를 확인하십시오." 출력
- install.sh --update 실패: 오류 내용 표시 후 "수동 업데이트를 시도하십시오." 안내
- 모든 오류 시 임시 디렉토리는 반드시 정리
