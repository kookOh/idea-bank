import gplay from 'google-play-scraper';
import { RawIdea } from './index';
import { collectWithRetry, deduplicateByField } from './utils';
import { isMegaApp, isExcludedCategory } from './mega-filter';
import { fetchWithTimeout } from '@/lib/fetch-utils';

// google-play-scraper의 fullDetail 결과 타입 (IAppItem에는 genre/genreId 없음)
interface PlayStoreApp {
  appId: string;
  title: string;
  summary?: string;
  developer?: string;
  genre?: string;
  genreId?: string;
  score?: number;
  url?: string;
}

async function fetchFromAppBrainFallback(): Promise<RawIdea[]> {
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

      const title = rawTitle.trim() || slug.replace(/-/g, ' ');

      results.push({
        title,
        description: `${title} - Google Play 신규 인기 앱 | Android 앱`,
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

async function fetchPlayStoreTrending(): Promise<RawIdea[]> {
  const results: RawIdea[] = [];

  try {
    // 무료 인기 앱 (한국) — fullDetail: true 로 genre/genreId 포함
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listFn = gplay.list as any;
    const topFreeApps: PlayStoreApp[] = await listFn({
      category: 'APPLICATION',
      collection: 'TOP_FREE',
      num: 30,
      country: 'kr',
      lang: 'ko',
      fullDetail: true,
    });

    // 매출 상위 앱 (한국)
    const grossingApps: PlayStoreApp[] = await listFn({
      category: 'APPLICATION',
      collection: 'GROSSING',
      num: 20,
      country: 'kr',
      lang: 'ko',
      fullDetail: true,
    });

    const allApps: PlayStoreApp[] = [...topFreeApps, ...grossingApps];
    const seen = new Set<string>();

    for (const app of allApps) {
      const appId = app.appId;
      if (seen.has(appId) || isMegaApp(appId)) continue;
      if (app.genreId && isExcludedCategory(app.genreId)) continue;
      seen.add(appId);

      const genre = app.genre ?? '앱';
      const developer = app.developer ?? '';
      const summary = app.summary?.slice(0, 150) ?? '';
      const rating = app.score ?? 0;
      const appUrl = app.url ?? `https://play.google.com/store/apps/details?id=${appId}`;

      results.push({
        title: app.title,
        description: `${genre} - ${developer} | ${summary}`,
        source: 'playstore',
        source_url: appUrl,
        score: Math.round(rating * 20),
        comment_count: 0,
        raw_data: {
          appId,
          developer,
          genre,
          genreId: app.genreId ?? '',
          rating,
          store: 'google_play',
        },
      });
    }
  } catch (err) {
    console.error('[PlayStore] google-play-scraper 실패, AppBrain fallback 시도:', err instanceof Error ? err.message : err);
    return fetchFromAppBrainFallback();
  }

  // 결과가 없으면 AppBrain fallback
  if (results.length === 0) {
    return fetchFromAppBrainFallback();
  }

  return results;
}

export async function collectPlayStore(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchPlayStoreTrending);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
