import type { GenerateRequest } from './types';

export function buildPrompt(req: GenerateRequest): string {
  const { idea, platform } = req;
  const stack = idea.recommended_stack?.join(', ') ?? 'Next.js, Supabase';
  const tags = idea.tags?.join(', ') ?? '';
  const mvpDays = idea.mvp_days ?? 14;

  if (platform === 'appintoss') {
    return `너는 한국어 프롬프트 엔지니어야. 앱인토스(토스 미니앱) 플랫폼용 구현 프롬프트를 생성해줘.

아이디어: ${idea.title}
설명: ${idea.summary_ko ?? '설명 없음'}
추천 스택: ${stack}

반드시 JSON만 출력해. 마크다운 코드펜스 없이 순수 JSON만.
{
  "project_name": "영문-소문자-프로젝트명",
  "overview": "한국어 프로젝트 한 줄 설명",
  "master_prompt": "앱인토스 미니앱 구현을 위한 상세 한국어 프롬프트 (TDS, Granite, AdMob IAA 포함, 800자 이상)",
  "phases": [
    {"step": 1, "title": "Granite 프로젝트 초기화", "prompt": "상세 지시"},
    {"step": 2, "title": "TDS UI 구축", "prompt": "상세 지시"},
    {"step": 3, "title": "핵심 기능 구현", "prompt": "상세 지시"},
    {"step": 4, "title": "광고 SDK 통합", "prompt": "상세 지시"},
    {"step": 5, "title": "빌드 & 심사 준비", "prompt": "상세 지시"}
  ],
  "tech_stack": ["React", "TDS", "Granite"],
  "free_services": ["토스 앱인토스 플랫폼", "AdMob IAA"]
}`;
  }

  return `너는 한국어 프롬프트 엔지니어야. Claude Code CLI용 구현 프롬프트를 생성해줘.

아이디어: ${idea.title}
설명: ${idea.summary_ko ?? '설명 없음'}
추천 스택: ${stack}
태그: ${tags}
MVP 기간: ${mvpDays}일
수익 잠재력: ${idea.revenue_potential ?? 3}/5
시장 규모: ${idea.market_size ?? '미정'}

master_prompt 작성 규칙:
1. 반드시 한국어로 작성
2. 이 아이디어에 특화된 구체적인 내용 (DB 테이블명, API 엔드포인트, UI 화면 목록)
3. 다음 섹션을 모두 포함:
   - [프로젝트 개요]: 무엇을 만드는지 2-3줄
   - [기술 스택]: 사용할 프레임워크/라이브러리 (무료만)
   - [DB 스키마]: Supabase 테이블 설계
   - [API 설계]: REST 엔드포인트 목록
   - [UI 화면]: 페이지별 컴포넌트 구성
   - [핵심 기능]: 비즈니스 로직 상세
   - [테스트]: Jest + Playwright
   - [배포]: Vercel + Supabase
4. "유료 서비스 절대 사용 금지" 포함
5. 최소 800자 이상

반드시 JSON만 출력해. 마크다운 코드펜스 없이 순수 JSON만.
{
  "project_name": "영문-소문자-프로젝트명",
  "overview": "한국어 프로젝트 한 줄 설명",
  "master_prompt": "위 규칙을 따른 상세 한국어 프롬프트",
  "phases": [
    {"step": 1, "title": "프로젝트 초기화", "prompt": "구체적 한국어 지시"},
    {"step": 2, "title": "DB/백엔드", "prompt": "구체적 한국어 지시"},
    {"step": 3, "title": "프론트엔드 UI", "prompt": "구체적 한국어 지시"},
    {"step": 4, "title": "핵심 기능", "prompt": "구체적 한국어 지시"},
    {"step": 5, "title": "테스트/배포", "prompt": "구체적 한국어 지시"}
  ],
  "tech_stack": ["Next.js", "Supabase"],
  "free_services": ["Vercel", "Supabase free"]
}`;
}

export function parseCliResponse(text: string): {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: { step: number; title: string; prompt: string }[];
  tech_stack: string[];
  free_services: string[];
} {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in CLI response');
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    project_name: parsed.project_name ?? 'my-project',
    overview: parsed.overview ?? '',
    master_prompt: parsed.master_prompt ?? '',
    phases: Array.isArray(parsed.phases) ? parsed.phases : [],
    tech_stack: Array.isArray(parsed.tech_stack) ? parsed.tech_stack : [],
    free_services: Array.isArray(parsed.free_services) ? parsed.free_services : [],
  };
}
