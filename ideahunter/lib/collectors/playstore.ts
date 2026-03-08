import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { collectWithRetry, deduplicateByField } from './utils';

/** 이미 너무 유명한 대형 앱 패키지 필터링 */
const MEGA_APP_PREFIXES = [
  'com.facebook.', 'com.google.', 'com.whatsapp', 'com.instagram.',
  'com.snapchat.', 'com.twitter.', 'com.zhiliaoapp.', 'com.spotify.',
  'com.netflix.', 'com.amazon.', 'com.microsoft.', 'com.apple.',
  'com.tencent.', 'com.bytedance.', 'com.samsung.', 'com.huawei.',
  'com.uber.', 'com.paypal.', 'jp.naver.line.', 'com.kakao.',
  'com.einnovation.temu', 'com.reddit.', 'com.discord',
  'com.linkedin.', 'org.telegram.', 'com.pinterest.',
];

function isMegaApp(appId: string): boolean {
  return MEGA_APP_PREFIXES.some((prefix) => appId.startsWith(prefix));
}

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

        let title = '';
        const titleMatch = context.match(/class="[^"]*"[^>]*>([^<]{2,60})<\/(?:span|div|a)/i);
        if (titleMatch?.[1]?.trim()) {
          title = titleMatch[1].trim();
        }
        if (!title) title = appId.split('.').pop() ?? appId;

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

export async function collectPlayStore(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchPlayStoreNew);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
