import { getSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseClient();
  // 오늘 다이제스트 있으면 반환
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('daily_digests')
    .select('*')
    .eq('date', today)
    .single();
  if (existing) return NextResponse.json(existing, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
  });

  // 없으면 실시간 생성
  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .gte('collected_at', new Date(Date.now() - 86400000).toISOString())
    .order('trend_score', { ascending: false })
    .limit(10);

  return NextResponse.json({
    date: today,
    top_ideas: ideas ?? [],
    hot_topics: [],
    market_insights: '',
  }, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
  });
}
