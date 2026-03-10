import { getSupabaseAdmin } from '@/lib/supabase';
import { collectHackerNews, collectReddit, collectProductHunt, collectGitHub, collectPlayStore, collectAppStore, collectAppBrain } from '@/lib/collectors';
import { analyzeIdea, calcTrendScore } from '@/lib/ai/analyzer';
import { verifyCronSecret } from '@/lib/auth';
import { generateDailyDigest } from '@/lib/digest-generator';
import { NextResponse } from 'next/server';

const COLLECTOR_NAMES = ['hackernews', 'reddit', 'producthunt', 'github', 'playstore', 'appstore', 'appbrain'] as const;

export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();

  const collectors = [collectHackerNews, collectReddit, collectProductHunt, collectGitHub, collectPlayStore, collectAppStore, collectAppBrain];
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

      const toInsert = [];
      for (const item of limited) {
        if (existingUrls.has(item.source_url)) continue;

        // AI 분석
        const analysis = await analyzeIdea(item.title, item.description, item.source);
        const trend_score = calcTrendScore(item.score, item.comment_count, analysis);
        toInsert.push({ ...item, ...analysis, trend_score });
        await new Promise((r) => setTimeout(r, 500)); // rate limit 방지
      }
      if (toInsert.length > 0) {
        const { error } = await supabase.from('ideas').insert(toInsert);
        if (error) console.error(`[${sourceName}] Batch insert failed:`, error.message);
        total += toInsert.length;
      }
      await supabase.from('collect_logs').insert({
        source: sourceName,
        collected_count: toInsert.length,
      });
    } catch (e) {
      await supabase.from('collect_logs').insert({
        source: sourceName,
        collected_count: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  await supabase.from('collect_logs').insert({ source: 'all', collected_count: total });

  const digest = await generateDailyDigest();

  return NextResponse.json({ collected: total, digest: digest ?? null });
}
