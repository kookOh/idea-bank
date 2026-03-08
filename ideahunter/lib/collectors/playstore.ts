import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { collectWithRetry, deduplicateByField } from './utils';

async function fetchPlayStoreTrending(): Promise<RawIdea[]> {
  const results: RawIdea[] = [];

  // Google Play 인기 앱 페이지 여러 URL 시도
  const urls = [
    'https://play.google.com/store/apps/top?hl=ko&gl=kr',
    'https://play.google.com/store/apps/collection/cluster?clp=ogoGCAEqAggB&hl=ko&gl=kr',
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

      // 패턴 1: details?id=... 링크에서 앱 ID 추출
      const idPattern = /\/store\/apps\/details\?id=([\w.]+)/g;
      let match;

      while ((match = idPattern.exec(html)) !== null) {
        const appId = match[1];
        if (seen.has(appId)) continue;
        seen.add(appId);

        // 앱 ID 주변에서 제목 추출 시도
        const contextStart = Math.max(0, match.index - 500);
        const contextEnd = Math.min(html.length, match.index + 500);
        const context = html.slice(contextStart, contextEnd);

        // 여러 패턴으로 제목 추출 시도
        const titlePatterns = [
          new RegExp(`>${escapeForRegex(appId)}[^<]*</a>\\s*</td>\\s*<td[^>]*>([^<]+)`, 'i'),
          new RegExp(`>([^<]{2,60})</[^>]*>\\s*(?:[^<]*<[^>]*>)*\\s*[^<]*${escapeForRegex(appId)}`, 'i'),
          new RegExp(`${escapeForRegex(appId)}[\\s\\S]{0,200}?class="[^"]*"[^>]*>([^<]{2,60})<`, 'i'),
          /class="[^"]*"[^>]*>([^<]{2,60})<\/(?:span|div|a)/i,
        ];

        let title = '';
        for (const tp of titlePatterns) {
          const tm = context.match(tp);
          if (tm?.[1] && tm[1].trim().length > 1) {
            title = tm[1].trim();
            break;
          }
        }

        if (!title) title = appId.split('.').pop() ?? appId;

        results.push({
          title,
          description: 'Google Play 트렌딩 앱',
          source: 'playstore',
          source_url: `https://play.google.com/store/apps/details?id=${appId}`,
          score: 0,
          comment_count: 0,
          raw_data: { appId, store: 'google_play' },
        });
      }

      if (results.length > 0) break; // 성공하면 다음 URL 스킵
    } catch (err) {
      console.error(`[PlayStore] Failed for ${url}:`, err instanceof Error ? err.message : err);
    }
  }

  // HTML 파싱 실패 시 AppBrain fallback
  if (results.length === 0) {
    return fetchFromAppBrain();
  }

  return results;
}

/** AppBrain에서 인기 앱 목록 가져오기 (fallback) */
async function fetchFromAppBrain(): Promise<RawIdea[]> {
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

    if (!res.ok) {
      console.error(`[PlayStore/AppBrain] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    // AppBrain 앱 링크 패턴: /app/앱이름/패키지명
    const appPattern = /\/app\/([^/"]+)\/([\w.]+)"[^>]*>\s*(?:<[^>]*>)*\s*([^<]+)/g;
    let match;
    const seen = new Set<string>();

    while ((match = appPattern.exec(html)) !== null) {
      const [, slug, appId, title] = match;
      if (seen.has(appId)) continue;
      seen.add(appId);

      results.push({
        title: title.trim() || slug.replace(/-/g, ' '),
        description: 'Google Play 신규 인기 앱 (AppBrain)',
        source: 'playstore',
        source_url: `https://play.google.com/store/apps/details?id=${appId}`,
        score: 0,
        comment_count: 0,
        raw_data: { appId, store: 'google_play', via: 'appbrain' },
      });
    }
  } catch (err) {
    console.error('[PlayStore/AppBrain] Failed:', err instanceof Error ? err.message : err);
  }

  return results;
}

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function collectPlayStore(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchPlayStoreTrending);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
