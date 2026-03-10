import { timingSafeEqual } from 'crypto';

/**
 * 타이밍 공격 방지를 적용한 CRON_SECRET 검증
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (token.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

/**
 * API_SECRET 기반 간단 인증 (공개 엔드포인트 보호용)
 * 헤더: x-api-key 또는 Authorization Bearer
 */
export function verifyApiKey(req: Request): boolean {
  const apiKey = process.env.API_SECRET;
  if (!apiKey) {
    console.error('SECURITY: API_SECRET is not set. Denying all requests.');
    return false;
  }

  const header = req.headers.get('x-api-key') ?? '';
  const bearer = req.headers.get('authorization')?.slice(7) ?? '';
  const token = header || bearer;

  if (!token || token.length !== apiKey.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(apiKey));
  } catch {
    return false;
  }
}
