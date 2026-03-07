import { getSupabaseAdmin } from '@/lib/supabase';
import { analyzeAitSuitability } from '@/lib/ai/ait-analyzer';
import { NextRequest, NextResponse } from 'next/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { data: idea } = await supabase.from('ideas').select('*').eq('id', id).single();
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 캐시 반환: 이미 분석된 경우
  if (idea.platform_analysis) {
    return NextResponse.json(idea.platform_analysis);
  }

  // 원자적 잠금: 동시 분석 요청 방지
  const { data: locked, error: lockError } = await supabase
    .from('ideas')
    .update({ implementation_status: 'analyzing' })
    .eq('id', id)
    .neq('implementation_status', 'analyzing')
    .select('id')
    .single();

  if (lockError || !locked) {
    return NextResponse.json(
      { error: 'AIT analysis already in progress' },
      { status: 429 }
    );
  }

  try {
    const analysis = await analyzeAitSuitability({
      title: idea.title,
      summary_ko: idea.summary_ko,
      tags: idea.tags,
      difficulty: idea.difficulty,
      revenue_potential: idea.revenue_potential,
      market_size: idea.market_size,
      recommended_stack: idea.recommended_stack,
    });

    await supabase.from('ideas').update({
      platform_analysis: analysis,
      implementation_status: null,
    }).eq('id', id);

    return NextResponse.json(analysis);
  } catch {
    await supabase.from('ideas').update({ implementation_status: null }).eq('id', id);
    return NextResponse.json({ error: 'AIT analysis failed' }, { status: 500 });
  }
}
