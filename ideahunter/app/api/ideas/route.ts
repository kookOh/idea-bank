import { getSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SORTS = new Set(['trend_score', 'latest', 'ait_score']);
const ALLOWED_SOURCES = new Set(['hackernews', 'reddit', 'producthunt', 'github', 'playstore', 'appstore']);
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(req.url);
  const sort = ALLOWED_SORTS.has(searchParams.get('sort') ?? '') ? searchParams.get('sort')! : 'trend_score';
  const source = searchParams.get('source');
  const tag = searchParams.get('tag');
  const page = Math.min(Math.max(0, parseInt(searchParams.get('page') ?? '0') || 0), 100);
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20') || 20), MAX_LIMIT);

  if (source && !ALLOWED_SOURCES.has(source)) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }
  if (tag && !/^[\w\s-]{1,50}$/.test(tag)) {
    return NextResponse.json({ error: 'Invalid tag format' }, { status: 400 });
  }

  const orderColumn = sort === 'latest' ? 'collected_at' : 'trend_score';

  let query = supabase
    .from('ideas')
    .select('*')
    .not('summary_ko', 'is', null)
    .order(orderColumn, { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  // ait_score 정렬: platform_analysis가 있는 아이디어만 필터링
  if (sort === 'ait_score') {
    query = supabase
      .from('ideas')
      .select('*')
      .not('summary_ko', 'is', null)
      .not('platform_analysis', 'is', null)
      .order('trend_score', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
  }

  if (source) query = query.eq('source', source);
  if (tag) query = query.contains('tags', [tag]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });

  // ait_score 정렬은 JSONB 필드이므로 서버 측 JS 정렬
  let ideas = data;
  if (sort === 'ait_score' && ideas) {
    ideas = [...ideas].sort((a, b) => {
      const scoreA = (a.platform_analysis as Record<string, unknown>)?.ait_score as number ?? 0;
      const scoreB = (b.platform_analysis as Record<string, unknown>)?.ait_score as number ?? 0;
      return scoreB - scoreA;
    });
  }

  return NextResponse.json(
    { ideas },
    {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
    }
  );
}
