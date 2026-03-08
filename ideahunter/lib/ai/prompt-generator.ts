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
  const stack = idea.recommended_stack?.join(', ') ?? 'Next.js, Supabase';
  const tags = idea.tags?.join(', ') ?? '';
  const mvpDays = idea.mvp_days ?? 14;

  const systemPrompt = `You are a Korean-language prompt engineer for Claude Code CLI.
You MUST respond with ONLY a JSON object. No markdown, no code fences, no explanation.
All text values in the JSON MUST be written in Korean (한국어).
The master_prompt must be extremely detailed and specific to the given idea.`;

  const userPrompt = `아이디어: ${idea.title}
설명: ${idea.summary_ko ?? '설명 없음'}
추천 스택: ${stack}
태그: ${tags}
MVP 기간: ${mvpDays}일
수익 잠재력: ${idea.revenue_potential ?? 3}/5
시장 규모: ${idea.market_size ?? '미정'}

위 아이디어를 실제로 구현하는 Claude Code 프롬프트를 JSON으로 생성해.

master_prompt 작성 규칙:
1. 반드시 한국어로 작성
2. 이 아이디어에 특화된 구체적인 내용 (DB 테이블명, API 엔드포인트, UI 화면 목록)
3. 다음 섹션을 모두 포함:
   - [프로젝트 개요]: 무엇을 만드는지 2-3줄
   - [기술 스택]: 사용할 프레임워크/라이브러리 (무료만)
   - [DB 스키마]: Supabase 테이블 설계 (테이블명, 컬럼, 관계)
   - [API 설계]: REST 엔드포인트 목록 (GET/POST/PUT/DELETE)
   - [UI 화면]: 페이지별 컴포넌트 구성
   - [핵심 기능]: 비즈니스 로직 상세
   - [테스트]: Jest 단위 + Playwright E2E
   - [배포]: Vercel + Supabase 배포 설정
4. "유료 서비스 절대 사용 금지. 에러 발생시 자동 수정 후 계속 진행." 포함
5. 최소 800자 이상

phases는 5단계로 나누되, 각 prompt는 해당 단계에서 구체적으로 할 일을 한국어로 상세히 작성.

JSON 형식:
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

  try {
    const res = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });
    const text = res.choices[0].message.content ?? '{}';
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const parsed = JSON.parse(json);
    return {
      project_name: parsed.project_name ?? 'my-project',
      overview: parsed.overview ?? idea.title,
      master_prompt: parsed.master_prompt ?? '',
      phases: Array.isArray(parsed.phases) ? parsed.phases : [],
      tech_stack: Array.isArray(parsed.tech_stack) ? parsed.tech_stack : [],
      free_services: Array.isArray(parsed.free_services) ? parsed.free_services : [],
    };
  } catch {
    return {
      project_name: 'my-project',
      overview: idea.title,
      master_prompt: '',
      phases: [],
      tech_stack: [],
      free_services: [],
    };
  }
}
