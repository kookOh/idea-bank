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
  const systemPrompt = `너는 Claude Code용 프롬프트 전문 설계자야.
주어진 비즈니스 아이디어를 바탕으로 Claude Code CLI에 입력할 프롬프트들을 설계해.
반드시 JSON으로만 응답해.`;

  const userPrompt = `
아이디어: ${idea.title}
설명: ${idea.summary_ko}
추천 스택: ${idea.recommended_stack?.join(', ')}
MVP 예상: ${idea.mvp_days}일

다음 JSON 형식으로 Claude Code 프롬프트 세트를 만들어줘:
{
  "project_name": "영문 소문자 프로젝트명",
  "overview": "프로젝트 한 줄 설명",
  "master_prompt": "Claude Code에 한 번에 입력할 전체 구현 프롬프트 (매우 상세하게, 기술스택/DB스키마/API/UI/테스트 모두 포함)",
  "phases": [
    { "step": 1, "title": "초기화", "prompt": "단계별 짧은 프롬프트" },
    { "step": 2, "title": "DB 설계", "prompt": "..." },
    { "step": 3, "title": "백엔드", "prompt": "..." },
    { "step": 4, "title": "프론트엔드", "prompt": "..." },
    { "step": 5, "title": "테스트/배포", "prompt": "..." }
  ],
  "tech_stack": ["Next.js", "Supabase"],
  "free_services": ["Vercel", "Supabase free", "Groq free"]
}

master_prompt는 반드시:
- 유료 서비스 사용 금지 명시
- 자동 테스트 포함 (Jest + Playwright)
- Vercel + Supabase 배포까지 포함
- 에러 발생시 자동 수정 후 계속 진행 지시
- 최소 500자 이상으로 상세하게`;

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
