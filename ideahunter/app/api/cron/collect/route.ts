import { getSupabaseAdmin } from '@/lib/supabase';
import { collectHackerNews, collectReddit, collectProductHunt, collectGitHub } from '@/lib/collectors';
import { analyzeIdea, calcTrendScore } from '@/lib/ai/analyzer';
import { NextResponse } from 'next/server';

const COLLECTOR_NAMES = ['hackernews', 'reddit', 'producthunt', 'github'] as const;

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collectors = [collectHackerNews, collectReddit, collectProductHunt, collectGitHub];
  let total = 0;

  for (let i = 0; i < collectors.length; i++) {
    const sourceName = COLLECTOR_NAMES[i];
    try {
      const items = await collectors[i]();
      const limited = items.slice(0, 10);

      // 배치 중복 체크: 모든 URL을 한 번에 조회
      const urls = limited.map((item) => item.source_url).filter(Boolean);
      const { data: existingRows } = await supabase
        .from('ideas')
        .select('source_url')
        .in('source_url', urls);
      const existingUrls = new Set(existingRows?.map((r) => r.source_url) ?? []);

      for (const item of limited) {
        if (existingUrls.has(item.source_url)) continue;

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
        source: sourceName,
        collected_count: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  await supabase.from('collect_logs').insert({ source: 'all', collected_count: total });
  return NextResponse.json({ collected: total });
}
