import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyApiKey } from '@/lib/auth';
import { generateImplementationPrompts } from '@/lib/ai/prompt-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { id } = await params;
  const { data: idea } = await supabase.from('ideas').select('*').eq('id', id).single();
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 이미 생성된 경우 캐시 반환
  if (idea.generated_prompts) return NextResponse.json(idea.generated_prompts);

  // 원자적 상태 체크: generating이 아닌 경우에만 업데이트
  const { data: updated, error: lockError } = await supabase
    .from('ideas')
    .update({ implementation_status: 'generating' })
    .eq('id', id)
    .neq('implementation_status', 'generating')
    .select('id')
    .single();

  if (lockError || !updated) {
    return NextResponse.json(
      { error: 'Prompt generation already in progress' },
      { status: 429 }
    );
  }

  try {
    const prompts = await generateImplementationPrompts(idea);
    if (!prompts.master_prompt) {
      await supabase.from('ideas').update({ implementation_status: 'error' }).eq('id', id);
      return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
    }
    await supabase.from('ideas').update({
      generated_prompts: prompts,
      implementation_status: 'done',
    }).eq('id', id);
    return NextResponse.json(prompts);
  } catch {
    await supabase.from('ideas').update({ implementation_status: 'error' }).eq('id', id);
    return NextResponse.json({ error: 'Prompt generation failed' }, { status: 500 });
  }
}
