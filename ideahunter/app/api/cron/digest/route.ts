import { verifyCronSecret } from '@/lib/auth';
import { generateDailyDigest } from '@/lib/digest-generator';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await generateDailyDigest();

  if (!result) {
    return NextResponse.json({ message: 'Not enough data for digest', count: 0 });
  }

  return NextResponse.json(result);
}
