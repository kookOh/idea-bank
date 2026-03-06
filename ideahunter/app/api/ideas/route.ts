import { getSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') ?? 'trend_score';
  const source = searchParams.get('source');
  const tag = searchParams.get('tag');
  const page = parseInt(searchParams.get('page') ?? '0');
  const limit = 20;

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
