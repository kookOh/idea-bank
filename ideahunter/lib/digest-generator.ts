import { getSupabaseAdmin } from '@/lib/supabase';
import Groq from 'groq-sdk';

export async function generateDailyDigest(): Promise<{ date: string; ideas_count: number; hot_topics_count: number } | null> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data: ideas } = await supabase
    .from('ideas')
    .select('id, title, summary_ko, trend_score, source, source_url')
    .gte('collected_at', new Date(Date.now() - 86400000).toISOString())
    .order('trend_score', { ascending: false })
    .limit(10);

  if (!ideas || ideas.length < 3) {
    return null;
  }

  let hot_topics: string[] = [];
  let market_insights = '';

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const ideaSummaries = ideas
      .map((i, idx) => `${idx + 1}. ${i.title}: ${i.summary_ko ?? ''}`)
      .join('\n');

    const res = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `다음 비즈니스 아이디어 목록을 분석해서 JSON으로만 응답해:

${ideaSummaries}

응답 형식:
{
  "hot_topics": ["트렌드1", "트렌드2", "트렌드3"],
  "market_insights": "시장 트렌드 분석 (2-3문장)"
}

hot_topics는 3-5개의 핵심 트렌드 키워드.`,
      }],
      max_tokens: 500,
      temperature: 0.3,
    });

    const text = res.choices[0].message.content ?? '{}';
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
    const parsed = JSON.parse(json);
    hot_topics = Array.isArray(parsed.hot_topics) ? parsed.hot_topics : [];
    market_insights = parsed.market_insights ?? '';
  } catch (err) {
    console.error('[Digest] AI analysis failed:', err instanceof Error ? err.message : err);
  }

  const { error } = await supabase
    .from('daily_digests')
    .upsert({
      date: today,
      top_ideas: ideas,
      hot_topics,
      market_insights,
    }, { onConflict: 'date' });

  if (error) {
    console.error('[Digest] Upsert failed:', error.message);
    return null;
  }

  return { date: today, ideas_count: ideas.length, hot_topics_count: hot_topics.length };
}
