import { getSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SORTS = new Set(['trend_score', 'latest']);
const ALLOWED_SOURCES = new Set(['hackernews', 'reddit', 'producthunt', 'github']);
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

  let query = supabase
    .from('ideas')
    .select('*')
    .not('summary_ko', 'is', null)
    .order(sort === 'latest' ? 'collected_at' : 'trend_score', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (source) query = query.eq('source', source);
  if (tag) query = query.contains('tags', [tag]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(
    { ideas: data },
    {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
    }
  );
}
