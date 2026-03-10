import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { collectWithRetry, deduplicateByField } from './utils';

import { isMegaApp } from './mega-filter';

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
          description: `${title} - ${page.label} | Android 앱`,
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
