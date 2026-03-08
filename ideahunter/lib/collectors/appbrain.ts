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

const APPBRAIN_PAGES = [
  { url: 'https://www.appbrain.com/stats/new-popular-android-apps', label: '신규 인기 앱', type: 'new' },
  { url: 'https://www.appbrain.com/stats/google-play-rankings/top_growing/all_categories/kr', label: '급상승 앱 (한국)', type: 'rising' },
  { url: 'https://www.appbrain.com/stats/google-play-rankings/top_growing/all_categories/', label: '급상승 앱 (글로벌)', type: 'rising' },
];

async function fetchAppBrainTrending(): Promise<RawIdea[]> {
  const results: RawIdea[] = [];

  for (const page of APPBRAIN_PAGES) {
    try {
      const res = await fetchWithTimeout(page.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }, 15000);

      if (!res.ok) {
        console.error(`[AppBrain] HTTP ${res.status} for ${page.label}`);
        continue;
      }

      const html = await res.text();
      const appPattern = /\/app\/([^/"]+)\/([\w.]+)"[^>]*>(?:\s*<[^>]*>)*\s*([^<]+)/g;
      let match;
      const seen = new Set<string>(results.map((r) => r.raw_data.appId));

      while ((match = appPattern.exec(html)) !== null) {
        const [, slug, appId, rawTitle] = match;
        if (seen.has(appId) || isMegaApp(appId)) continue;
        seen.add(appId);

        const title = rawTitle.trim() || slug.replace(/-/g, ' ');

        results.push({
          title,
          description: `${page.label} - AppBrain 트렌드 분석`,
          source: 'appbrain',
          source_url: `https://play.google.com/store/apps/details?id=${appId}`,
          score: 0,
          comment_count: 0,
          raw_data: { appId, slug, category: page.label, type: page.type, store: 'google_play', via: 'appbrain' },
        });
      }
    } catch (err) {
      console.error(`[AppBrain] ${page.label} failed:`, err instanceof Error ? err.message : err);
    }
  }

  return results;
}

export async function collectAppBrain(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchAppBrainTrending);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
