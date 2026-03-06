import { getSupabaseAdmin } from '@/lib/supabase';
import { collectHackerNews, collectReddit, collectProductHunt, collectGitHub } from '@/lib/collectors';
import { analyzeIdea, calcTrendScore } from '@/lib/ai/analyzer';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collectors = [collectHackerNews, collectReddit, collectProductHunt, collectGitHub];
  let total = 0;

  for (const collector of collectors) {
    try {
      const items = await collector();
      for (const item of items.slice(0, 10)) {
        // 중복 체크
        const { data: existing } = await supabase
          .from('ideas')
          .select('id')
          .eq('source_url', item.source_url)
          .single();
        if (existing) continue;

        // AI 분석
        const analysis = await analyzeIdea(item.title, item.description);
        const trend_score = calcTrendScore(item.score, item.comment_count, analysis);

        await supabase.from('ideas').insert({
          ...item,
          ...analysis,
          trend_score,
        });
        total++;
        await new Promise((r) => setTimeout(r, 500)); // rate limit 방지
      }
    } catch (e) {
      await supabase.from('collect_logs').insert({
        source: 'unknown',
        collected_count: 0,
        error: String(e),
      });
    }
  }

  await supabase.from('collect_logs').insert({ source: 'all', collected_count: total });
  return NextResponse.json({ collected: total });
}
