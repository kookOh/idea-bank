import { getGroqClient } from './groq-client';
import { formatAitPrompt } from '@/lib/prompt-formatter';
import type { PlatformAnalysis } from '@/types/idea';

export type GeneratedPrompts = {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: { step: number; title: string; prompt: string }[];
  tech_stack: string[];
  free_services: string[];
};

export async function generateImplementationPrompts(
  idea: {
    title: string;
    summary_ko?: string | null;
    recommended_stack?: string[] | null;
    mvp_days?: number | null;
    tags?: string[] | null;
    revenue_potential?: number | null;
    market_size?: string | null;
    platform_analysis?: PlatformAnalysis | null;
  },
  platform?: 'appintoss'
): Promise<GeneratedPrompts> {
  // 앱인토스 플랫폼인 경우 마스터 프롬프트 포맷 사용
  if (platform === 'appintoss' && idea.platform_analysis) {
    const aitPrompt = formatAitPrompt(idea, idea.platform_analysis);
    return {
      project_name: idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'ait-app',
      overview: `앱인토스 미니앱: ${idea.summary_ko ?? idea.title}`,
      master_prompt: aitPrompt,
      phases: [
        { step: 1, title: 'Granite 프로젝트 초기화', prompt: 'npm create granite-app으로 프로젝트 생성, granite.config.ts 설정' },
        { step: 2, title: 'TDS UI 구축', prompt: 'TDS 컴포넌트로 핵심 화면 구현 (NavigationBar, Button, Input 등)' },
        { step: 3, title: '핵심 기능 구현', prompt: '비즈니스 로직 + API 연동 + 상태 관리' },
        { step: 4, title: '광고 SDK 통합', prompt: 'AdMob IAA SDK 통합 + 광고 배치 최적화' },
        { step: 5, title: '빌드 & 심사 준비', prompt: 'granite build → .ait 생성 → 심사 체크리스트 확인' },
      ],
      tech_stack: idea.platform_analysis.ait_target_type === 'react-native'
        ? ['React Native', '@apps-in-toss/framework', 'TDS', 'Granite']
        : ['React', 'Vite', '@apps-in-toss/web-framework', 'TDS', 'Granite'],
      free_services: ['토스 앱인토스 플랫폼', 'AdMob IAA', 'Supabase free'],
    };
  }
  const stack = idea.recommended_stack ?? ['Next.js', 'Supabase'];
  const stackStr = stack.join(', ');
  const tags = idea.tags ?? [];
  const mvpDays = idea.mvp_days ?? 14;
  const projectName = idea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'my-project';

  // LLM에는 기술 상세(DB/API/UI)만 요청, 프롬프트 구조는 템플릿으로 보장
  const details = await generateTechDetails(idea);

  const masterPrompt = `다음 프로젝트를 처음부터 끝까지 완전히 구현해주세요.

## 프로젝트 개요
"${idea.title}" - ${idea.summary_ko ?? idea.title}
시장 규모: ${idea.market_size ?? '미정'} | MVP 기간: ${mvpDays}일 | 태그: ${tags.join(', ') || '일반'}

## 기술 스택 (무료만 사용)
- 프레임워크: ${stackStr}
- DB: Supabase (PostgreSQL + Auth + Storage)
- 배포: Vercel (무료 플랜)
- 테스트: Jest (단위) + Playwright (E2E)
- 스타일: Tailwind CSS

## DB 스키마 (Supabase)
${details.db_schema}

## API 설계
${details.api_endpoints}

## UI 화면 구성
${details.ui_screens}

## 핵심 기능
${details.core_features}

## 구현 규칙
- 유료 서비스 절대 사용 금지. 모든 외부 서비스는 무료 플랜만 사용
- 에러 발생 시 자동으로 수정하고 계속 진행
- TypeScript strict 모드 사용
- 모든 API 엔드포인트에 에러 핸들링 포함
- 환경변수는 .env.local 예시 파일 생성
- Git 초기화 및 .gitignore 설정
- Jest 단위 테스트 + Playwright E2E 테스트 작성
- Vercel 배포 설정 (vercel.json) 포함
- README.md에 설치/실행 방법 문서화`;

  return {
    project_name: projectName,
    overview: idea.summary_ko ?? idea.title,
    master_prompt: masterPrompt,
    phases: [
      { step: 1, title: '프로젝트 초기화', prompt: `Next.js 프로젝트 생성 (${stackStr}). TypeScript strict, Tailwind CSS, ESLint 설정. .env.local 예시 파일 작성. Git 초기화.` },
      { step: 2, title: 'DB 스키마 & 백엔드', prompt: `Supabase 테이블 생성:\n${details.db_schema}\n\nAPI 라우트 구현:\n${details.api_endpoints}` },
      { step: 3, title: '프론트엔드 UI', prompt: `페이지 및 컴포넌트 구현:\n${details.ui_screens}\n\nTailwind CSS로 반응형 디자인. 다크모드 지원.` },
      { step: 4, title: '핵심 기능 연결', prompt: `비즈니스 로직 구현:\n${details.core_features}\n\nSupabase Auth 연동, 실시간 기능 필요 시 Realtime 사용.` },
      { step: 5, title: '테스트 & 배포', prompt: `Jest 단위 테스트 (주요 API/유틸), Playwright E2E 테스트 (핵심 사용자 플로우). vercel.json 설정. README.md 작성. 빌드 오류 수정 후 배포 준비 완료.` },
    ],
    tech_stack: stack,
    free_services: ['Vercel free', 'Supabase free', 'GitHub free'],
  };
}

/** LLM으로 아이디어 맞춤 기술 상세를 생성 (DB/API/UI/기능) */
async function generateTechDetails(idea: {
  title: string;
  summary_ko?: string | null;
  recommended_stack?: string[] | null;
  tags?: string[] | null;
}): Promise<{ db_schema: string; api_endpoints: string; ui_screens: string; core_features: string }> {
  const fallback = buildFallbackDetails(idea);

  try {
    const res = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Respond with ONLY a JSON object. No markdown. No code fences.' },
        { role: 'user', content: `Idea: ${idea.title}
Description: ${idea.summary_ko ?? idea.title}
Tags: ${idea.tags?.join(', ') ?? ''}

Generate technical details for this web app in Korean (한국어). Return JSON:
{
  "db_schema": "Supabase 테이블 목록 (테이블명, 주요 컬럼 나열, 한 테이블당 한 줄. 예: - users: id, email, name, created_at)",
  "api_endpoints": "REST API 목록 (예: - GET /api/users: 사용자 목록 조회)",
  "ui_screens": "화면 목록 (예: - /: 메인 대시보드 - 통계 카드, 최근 활동)",
  "core_features": "핵심 기능 3-5개 (예: - 사용자 인증: 이메일/소셜 로그인 (Supabase Auth))"
}

Each field: 3-6 bullet points starting with "- ". Write in Korean.` },
      ],
      max_tokens: 1000,
      temperature: 0.4,
    });
    const text = res.choices[0].message.content ?? '{}';
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const parsed = JSON.parse(json);

    return {
      db_schema: typeof parsed.db_schema === 'string' && parsed.db_schema.includes('-') ? parsed.db_schema : fallback.db_schema,
      api_endpoints: typeof parsed.api_endpoints === 'string' && parsed.api_endpoints.includes('-') ? parsed.api_endpoints : fallback.api_endpoints,
      ui_screens: typeof parsed.ui_screens === 'string' && parsed.ui_screens.includes('-') ? parsed.ui_screens : fallback.ui_screens,
      core_features: typeof parsed.core_features === 'string' && parsed.core_features.includes('-') ? parsed.core_features : fallback.core_features,
    };
  } catch {
    return fallback;
  }
}

/** LLM 실패 시 아이디어 기반 기본 상세 */
function buildFallbackDetails(idea: { title: string; summary_ko?: string | null }) {
  const name = idea.title.slice(0, 20);
  return {
    db_schema: `- users: id (uuid), email, name, avatar_url, created_at
- ${name}_items: id (uuid), user_id (FK), title, content, status, created_at, updated_at
- categories: id (uuid), name, slug, description`,
    api_endpoints: `- GET /api/items: 목록 조회 (페이지네이션, 필터)
- POST /api/items: 새 항목 생성
- GET /api/items/[id]: 상세 조회
- PUT /api/items/[id]: 수정
- DELETE /api/items/[id]: 삭제
- GET /api/categories: 카테고리 목록`,
    ui_screens: `- /: 메인 대시보드 (요약 통계, 최근 항목)
- /items: 항목 목록 (검색, 필터, 정렬)
- /items/[id]: 항목 상세 페이지
- /items/new: 새 항목 작성
- /auth/login: 로그인/회원가입
- /settings: 사용자 설정`,
    core_features: `- 사용자 인증: Supabase Auth (이메일/소셜 로그인)
- CRUD: 핵심 데이터의 생성/조회/수정/삭제
- 실시간 업데이트: Supabase Realtime으로 변경사항 반영
- 검색/필터: 키워드 검색 + 카테고리 필터
- 반응형 UI: 모바일/데스크톱 대응`,
  };
}
