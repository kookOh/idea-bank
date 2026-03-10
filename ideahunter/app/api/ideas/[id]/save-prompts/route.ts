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
    // body 크기 제한 (50KB)
    const contentLength = parseInt(req.headers.get('content-length') ?? '0');
    if (contentLength > 50_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

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

    // 문자열 길이 제한
    if (prompts.master_prompt.length > 30_000 || prompts.project_name.length > 100 || prompts.overview.length > 1000) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
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
