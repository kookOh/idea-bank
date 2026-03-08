import { getSupabaseAdmin } from '@/lib/supabase';
import { generateImplementationPrompts } from '@/lib/ai/prompt-generator';
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

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform') as 'appintoss' | null;
  const force = searchParams.get('force') === 'true';

  // 이미 생성된 경우 캐시 반환 (force=true면 무시)
  if (!force && idea.generated_prompts) {
    // appintoss 플랫폼 요청 시 appintoss 키가 있으면 반환
    if (platform === 'appintoss' && idea.generated_prompts.appintoss) {
      return NextResponse.json(idea.generated_prompts.appintoss);
    }
    if (!platform) {
      // 기존 호환: flat 구조 또는 default 키
      const defaultPrompts = idea.generated_prompts.default ?? idea.generated_prompts;
      if (defaultPrompts.master_prompt) return NextResponse.json(defaultPrompts);
    }
  }

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
    const prompts = await generateImplementationPrompts(idea, platform ?? undefined);
    if (!prompts.master_prompt) {
      await supabase.from('ideas').update({ implementation_status: 'error' }).eq('id', id);
      return NextResponse.json({ error: 'Failed to generate prompts' }, { status: 500 });
    }

    // generated_prompts를 { default, appintoss } 구조로 저장
    const existingPrompts = idea.generated_prompts ?? {};
    const promptKey = platform === 'appintoss' ? 'appintoss' : 'default';
    const updatedPrompts = { ...existingPrompts, [promptKey]: prompts };

    await supabase.from('ideas').update({
      generated_prompts: updatedPrompts,
      implementation_status: 'done',
    }).eq('id', id);
    return NextResponse.json(prompts);
  } catch {
    await supabase.from('ideas').update({ implementation_status: 'error' }).eq('id', id);
    return NextResponse.json({ error: 'Prompt generation failed' }, { status: 500 });
  }
}
