# Analytics Events

IdeaHunter 서비스에서 추적하는 분석 이벤트 목록.

---

## page_view

- **설명**: 페이지 조회
- **트리거**: 모든 페이지 진입 시 (/, /ait, /digest)
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | path | `string` | 현재 경로 (예: `/`, `/ait`, `/digest`) |
  | referrer | `string \| null` | 이전 페이지 URL |

---

## idea_card_click

- **설명**: 아이디어 카드 클릭
- **트리거**: IdeaCard 컴포넌트 클릭 시 (상세 확장 또는 모달 열기)
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | idea_id | `string (uuid)` | 아이디어 ID |
  | source | `string` | 수집 출처 (hackernews, reddit 등) |

---

## filter_change

- **설명**: 필터 변경
- **트리거**: FilterBar에서 정렬, 소스, 태그, 앱인토스 필터 변경 시
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | filter_type | `'sort' \| 'source' \| 'tag' \| 'ait_only'` | 변경된 필터 종류 |
  | value | `string` | 변경된 값 |

---

## prompt_generate

- **설명**: 프롬프트 생성 요청
- **트리거**: ImplementationModal에서 "프롬프트 생성" 버튼 클릭 시
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | idea_id | `string (uuid)` | 아이디어 ID |
  | platform | `'default' \| 'appintoss'` | 대상 플랫폼 |
  | force | `boolean` | 강제 재생성 여부 |

---

## prompt_copy

- **설명**: 프롬프트 복사
- **트리거**: ImplementationModal에서 프롬프트 텍스트 클립보드 복사 시
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | idea_id | `string (uuid)` | 아이디어 ID |
  | tab | `'master' \| 'phases' \| 'stack'` | 복사한 탭 |
  | section | `string` | 복사한 섹션 (예: master_prompt, phase_1 등) |

---

## ait_analyze

- **설명**: 앱인토스 분석 요청
- **트리거**: IdeaCard에서 "앱인토스 분석" 버튼 클릭 시
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | idea_id | `string (uuid)` | 아이디어 ID |

---

## ait_prompt_copy

- **설명**: 앱인토스 프롬프트 복사
- **트리거**: 앱인토스 전용 프롬프트 클립보드 복사 시
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | idea_id | `string (uuid)` | 아이디어 ID |

---

## collect_run

- **설명**: 수집 실행 (서버 사이드)
- **트리거**: /api/cron/collect 호출 시 (각 소스별 + 전체 합산)
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | source | `string` | 수집 소스 (hackernews, reddit, ..., all) |
  | count | `number` | 수집된 아이디어 수 |
  | errors | `string \| null` | 에러 메시지 (실패 시) |

---

## digest_view

- **설명**: 다이제스트 조회
- **트리거**: /digest 페이지 진입 시 또는 DigestModal 열기 시
- **페이로드**:
  | 필드 | 타입 | 설명 |
  |------|------|------|
  | date | `string (YYYY-MM-DD)` | 다이제스트 날짜 |
