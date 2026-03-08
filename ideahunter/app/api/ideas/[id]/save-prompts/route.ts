import { getSupabaseAdmin } from '@/lib/supabase';
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

  const { data: idea } = await supabase.from('ideas').select('id, generated_prompts').eq('id', id).single();
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const prompts = await req.json();

    // 페이로드 형식 검증
    if (
      typeof prompts.master_prompt !== 'string' || !prompts.master_prompt ||
      typeof prompts.project_name !== 'string' ||
      typeof prompts.overview !== 'string' ||
      !Array.isArray(prompts.phases) ||
      !Array.isArray(prompts.tech_stack) ||
      !Array.isArray(prompts.free_services)
    ) {
      return NextResponse.json({ error: 'Invalid prompt payload shape' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform') as 'appintoss' | null;
    const promptKey = platform === 'appintoss' ? 'appintoss' : 'default';

    const existingPrompts = idea.generated_prompts ?? {};
    const updatedPrompts = { ...existingPrompts, [promptKey]: prompts };

    const { error: updateError } = await supabase.from('ideas').update({
      generated_prompts: updatedPrompts,
      implementation_status: 'done',
    }).eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save prompts' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
