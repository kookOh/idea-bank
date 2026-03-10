import { verifyCronSecret, verifyApiKey } from '@/lib/auth';

describe('verifyCronSecret', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test-secret-123' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  test('정상 Bearer 토큰 인증 성공', () => {
    expect(verifyCronSecret('Bearer test-secret-123')).toBe(true);
  });

  test('잘못된 토큰 인증 실패', () => {
    expect(verifyCronSecret('Bearer wrong-secret')).toBe(false);
  });

  test('null 헤더 인증 실패', () => {
    expect(verifyCronSecret(null)).toBe(false);
  });

  test('빈 문자열 인증 실패', () => {
    expect(verifyCronSecret('')).toBe(false);
  });

  test('Bearer 접두사 없는 토큰 인증 실패', () => {
    expect(verifyCronSecret('test-secret-123')).toBe(false);
  });

  test('CRON_SECRET 미설정 시 실패', () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronSecret('Bearer anything')).toBe(false);
  });
});

describe('verifyApiKey', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, API_SECRET: 'api-key-456' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  test('x-api-key 헤더로 인증 성공', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'api-key-456' },
    });
    expect(verifyApiKey(req)).toBe(true);
  });

  test('Authorization Bearer로 인증 성공', () => {
    const req = new Request('http://localhost', {
      headers: { 'Authorization': 'Bearer api-key-456' },
    });
    expect(verifyApiKey(req)).toBe(true);
  });

  test('잘못된 키 인증 실패', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-api-key': 'wrong-key' },
    });
    expect(verifyApiKey(req)).toBe(false);
  });

  test('API_SECRET 미설정 시 fail-closed (false)', () => {
    delete process.env.API_SECRET;
    const req = new Request('http://localhost');
    expect(verifyApiKey(req)).toBe(false);
  });
});
