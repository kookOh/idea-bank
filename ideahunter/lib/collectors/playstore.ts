import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { collectWithRetry, deduplicateByField } from './utils';

import { isMegaApp } from './mega-filter';

async function fetchPlayStoreNew(): Promise<RawIdea[]> {
  const results: RawIdea[] = [];

  // Google Play "신규" / "인기 상승" 컬렉션 타겟
  const urls = [
    'https://play.google.com/store/apps/new?hl=ko&gl=kr',
    'https://play.google.com/store/apps/top?hl=ko&gl=kr',
  ];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }, 15000);

      if (!res.ok) continue;

      const html = await res.text();
      const seen = new Set<string>();
      const idPattern = /\/store\/apps\/details\?id=([\w.]+)/g;
      let match;

      while ((match = idPattern.exec(html)) !== null) {
        const appId = match[1];
        if (seen.has(appId) || isMegaApp(appId)) continue;
        seen.add(appId);

        // 앱 ID 주변에서 제목 추출
        const contextStart = Math.max(0, match.index - 500);
        const contextEnd = Math.min(html.length, match.index + 500);
        const context = html.slice(contextStart, contextEnd);

        const title = extractTitle(context, appId);

        const isNewPage = url.includes('/new');
        results.push({
          title,
          description: isNewPage ? 'Google Play 신규 등록 앱' : 'Google Play 인기 상승 앱',
          source: 'playstore',
          source_url: `https://play.google.com/store/apps/details?id=${appId}`,
          score: 0,
          comment_count: 0,
          raw_data: { appId, store: 'google_play', type: isNewPage ? 'new' : 'rising' },
        });
      }
    } catch (err) {
      console.error(`[PlayStore] Failed for ${url}:`, err instanceof Error ? err.message : err);
    }
  }

  // Google Play 파싱 실패 시 AppBrain fallback
  if (results.length === 0) {
    return fetchNewFromAppBrain();
  }

  return results;
}

/** AppBrain에서 신규 인기 앱 가져오기 (fallback) */
async function fetchNewFromAppBrain(): Promise<RawIdea[]> {
  const results: RawIdea[] = [];

  try {
    const res = await fetchWithTimeout(
      'https://www.appbrain.com/stats/new-popular-android-apps',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      },
      15000
    );

    if (!res.ok) return [];

    const html = await res.text();
    const appPattern = /\/app\/([^/"]+)\/([\w.]+)"[^>]*>\s*(?:<[^>]*>)*\s*([^<]+)/g;
    let match;
    const seen = new Set<string>();

    while ((match = appPattern.exec(html)) !== null) {
      const [, slug, appId, rawTitle] = match;
      if (seen.has(appId) || isMegaApp(appId)) continue;
      seen.add(appId);

      results.push({
        title: rawTitle.trim() || slug.replace(/-/g, ' '),
        description: 'Google Play 신규 인기 앱 (AppBrain)',
        source: 'playstore',
        source_url: `https://play.google.com/store/apps/details?id=${appId}`,
        score: 0,
        comment_count: 0,
        raw_data: { appId, store: 'google_play', type: 'new', via: 'appbrain' },
      });
    }
  } catch (err) {
    console.error('[PlayStore/AppBrain] Failed:', err instanceof Error ? err.message : err);
  }

  return results;
}

/** HTML 컨텍스트에서 앱 제목 추출, 실패 시 패키지명을 사람이 읽기 좋게 변환 */
function extractTitle(context: string, appId: string): string {
  // 여러 패턴으로 제목 추출 시도
  const patterns = [
    // aria-label 속성에서 앱 이름
    /aria-label="([^"]{2,60})"/i,
    // alt 속성에서 앱 이름
    /alt="([^"]{2,60})"/i,
    // 링크 텍스트
    />([^<]{2,60})<\/a>/i,
    // span/div 텍스트
    /class="[^"]*"[^>]*>([^<]{2,60})<\/(?:span|div)/i,
  ];

  for (const pattern of patterns) {
    const m = context.match(pattern);
    if (m?.[1]?.trim() && !looksLikeJunk(m[1].trim())) {
      return m[1].trim();
    }
  }

  // fallback: 패키지명을 읽기 좋은 형태로 변환
  // com.example.myapp → My App
  const lastPart = appId.split('.').pop() ?? appId;
  return lastPart
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → space
    .replace(/[_-]/g, ' ')                  // snake_case → space
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize
}

/** HTML 태그 잔해나 의미 없는 문자열 필터 */
function looksLikeJunk(str: string): boolean {
  if (/^[\d\s.,]+$/.test(str)) return true;       // 숫자만
  if (/^[{[\]}<>\/\\]/.test(str)) return true;     // 코드 잔해
  if (str.length < 2) return true;                  // 너무 짧음
  if (/^\s*(true|false|null|undefined)\s*$/i.test(str)) return true;
  return false;
}

export async function collectPlayStore(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchPlayStoreNew);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
