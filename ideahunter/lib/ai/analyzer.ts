import { getGroqClient } from './groq-client';

export async function analyzeIdea(title: string, description: string) {
  const prompt = `다음 비즈니스 아이디어를 분석해서 JSON으로만 응답해 (다른 텍스트 없이):

아이디어: ${title}
설명: ${description}

응답 형식:
{
  "summary_ko": "한국어로 2-3문장 핵심 요약",
  "market_size": "시장 규모 추정 (예: 글로벌 $5B, 국내 500억)",
  "difficulty": 3,
  "revenue_potential": 4,
  "competition": 3,
  "recommended_stack": ["Next.js", "Supabase", "Stripe"],
  "mvp_days": 14,
  "tags": ["SaaS", "AI", "B2B"]
}

difficulty/revenue_potential/competition은 1-5 정수.`;

  try {
    const res = await getGroqClient().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
    });
    const text = res.choices[0].message.content ?? '{}';
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const parsed = JSON.parse(json);
    // 필수 필드 검증: 없으면 기본값으로 보충
    return {
      summary_ko: parsed.summary_ko ?? description.slice(0, 100),
      market_size: parsed.market_size ?? '추정 불가',
      difficulty: Math.min(5, Math.max(1, parsed.difficulty ?? 3)),
      revenue_potential: Math.min(5, Math.max(1, parsed.revenue_potential ?? 3)),
      competition: Math.min(5, Math.max(1, parsed.competition ?? 3)),
      recommended_stack: Array.isArray(parsed.recommended_stack) ? parsed.recommended_stack : ['Next.js', 'Supabase'],
      mvp_days: parsed.mvp_days ?? 30,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['기타'],
    };
  } catch {
    return {
      summary_ko: description.slice(0, 100),
      market_size: '추정 불가',
      difficulty: 3,
      revenue_potential: 3,
      competition: 3,
      recommended_stack: ['Next.js', 'Supabase'],
      mvp_days: 30,
      tags: ['기타'],
    };
  }
}

export function calcTrendScore(score: number, comments: number, analysis: any): number {
  const base = score * 0.4 + comments * 0.3;
  const potential = (analysis.revenue_potential / 5) * 40;
  const ease = ((6 - analysis.difficulty) / 5) * 30;
  return Math.round(base * 0.1 + potential + ease);
}
