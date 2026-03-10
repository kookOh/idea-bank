# Launch Checklist

IdeaHunter 런칭 전 점검 체크리스트.

---

## 인프라

- [ ] Vercel 프로젝트 배포 완료 (Hobby 플랜)
- [ ] Supabase 프로젝트 생성 및 스키마 적용 (ideas, daily_digests, collect_logs)
- [ ] 환경변수 설정 완료
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `GROQ_API_KEY`
  - [ ] `CRON_SECRET`
- [ ] Vercel Cron 설정 (`/api/cron/collect` 주기적 실행)
- [ ] Vercel Cron 설정 (`/api/cron/digest` 일일 다이제스트 생성)

---

## 데이터 수집

- [ ] HackerNews 수집기 정상 동작
- [ ] Reddit 수집기 정상 동작
- [ ] ProductHunt 수집기 정상 동작
- [ ] GitHub 수집기 정상 동작
- [ ] PlayStore 수집기 정상 동작
- [ ] AppStore 수집기 정상 동작
- [ ] AppBrain 수집기 정상 동작
- [ ] 중복 URL 필터링 동작 확인
- [ ] AI 분석 (Groq llama-3.1-8b-instant) 정상 응답
- [ ] trend_score 계산 정상
- [ ] collect_logs 기록 확인

---

## AI 분석 및 프롬프트

- [ ] Groq API 연결 확인 (llama-3.1-8b-instant, llama-3.3-70b-versatile)
- [ ] 아이디어 분석 (summary_ko, difficulty, revenue_potential 등) 정상 생성
- [ ] 프롬프트 생성 (default) 정상 동작
- [ ] 프롬프트 생성 (appintoss) 정상 동작
- [ ] 프롬프트 캐싱 동작 (force=false 시 기존 프롬프트 반환)
- [ ] 동시 생성 방지 (원자적 잠금) 정상 동작

---

## UI

- [ ] 메인 피드 (/) 아이디어 카드 그리드 표시
- [ ] FilterBar: 정렬 (트렌드/최신/앱인토스) 동작
- [ ] FilterBar: 소스 필터 동작
- [ ] FilterBar: 태그 필터 동작
- [ ] FilterBar: 앱인토스 전용 토글 동작
- [ ] IdeaCard: 기본 정보 표시 (제목, 출처, 점수, 태그)
- [ ] IdeaCard: AI 분석 결과 표시 (난이도, 수익성, 경쟁도)
- [ ] ImplementationModal: 프롬프트 생성 및 표시
- [ ] ImplementationModal: 클립보드 복사 동작
- [ ] 페이지네이션 ("더 보기") 동작
- [ ] 빈 상태 (empty state) 메시지 표시
- [ ] 에러 상태 + 재시도 버튼 동작
- [ ] 로딩 상태 표시

---

## 앱인토스 (Apps-in-Toss)

- [ ] 앱인토스 분석 API (`/api/ideas/{id}/analyze-ait`) 정상 동작
- [ ] PlatformAnalysis 결과 정상 (ait_score, ait_category, ait_target_type)
- [ ] 앱인토스 대시보드 (/ait) 카테고리별 분류 표시
- [ ] 앱인토스 대시보드 ait_score 순 정렬
- [ ] 앱인토스 전용 프롬프트 생성 (platform=appintoss)
- [ ] 앱인토스 프롬프트 포맷 (platform_type, improvement_points, marketing_strategy)

---

## 다이제스트

- [ ] 다이제스트 페이지 (/digest) TOP 10 표시
- [ ] 일일 다이제스트 자동 생성 (cron)
- [ ] 캐시된 다이제스트 반환 (같은 날짜)
- [ ] 실시간 폴백 다이제스트 생성 (없을 경우)

---

## 보안

- [ ] Supabase RLS (Row Level Security) 활성화
- [ ] CRON_SECRET Bearer 인증 동작 확인
- [ ] UUID 검증 (정규식) 적용 확인
- [ ] 입력 검증: source 화이트리스트
- [ ] 입력 검증: tag 정규식 패턴
- [ ] 입력 검증: page/limit 범위 제한
- [ ] API 키 환경변수 (클라이언트 노출 없음)

---

## 성능

- [ ] `next build` 성공 (빌드 에러 없음)
- [ ] Lighthouse 성능 점수 확인 (목표: 80+)
- [ ] API 응답 시간 확인 (목표: <2초)
- [ ] Cache-Control 헤더 적용 확인 (ideas: 300s, digest: 3600s)
- [ ] 이미지 최적화 (Next.js Image 사용 시)

---

## 모니터링

- [ ] collect_logs 테이블에 수집 이력 기록 확인
- [ ] 수집 실패 시 에러 메시지 기록 확인
- [ ] Vercel 함수 로그 확인
- [ ] Groq API rate limit 대응 (500ms 딜레이) 동작 확인
