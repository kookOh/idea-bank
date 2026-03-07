import { getSupabaseAdmin } from '@/lib/supabase';
import { generateImplementationPrompts } from '@/lib/ai/prompt-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;
  const { data: idea } = await supabase.from('ideas').select('*').eq('id', id).single();
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 이미 생성된 경우 캐시 반환
  if (idea.generated_prompts) return NextResponse.json(idea.generated_prompts);

  // 생성 중인 경우 중복 요청 방지
  if (idea.implementation_status === 'generating') {
    return NextResponse.json(
      { error: 'Prompt generation already in progress' },
      { status: 429 }
    );
  }

  await supabase.from('ideas').update({ implementation_status: 'generating' }).eq('id', id);

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
