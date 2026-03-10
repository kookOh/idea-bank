import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { collectWithRetry, deduplicateByField } from './utils';

interface AppleRSSApp {
  id: string;
  name: string;
  url: string;
  artistName: string;
  genres: { genreId: string; name: string; url: string }[];
}

async function fetchAppStoreTrending(): Promise<RawIdea[]> {
  const results: RawIdea[] = [];

  try {
    // Apple 공식 RSS Feed (안정적)
    const res = await fetchWithTimeout(
      'https://rss.applemarketingtools.com/api/v2/kr/apps/top-free/25/apps.json'
    );

    if (!res.ok) {
      console.error(`[AppStore] HTTP ${res.status}`);
      return fetchAppStoreFallback();
    }

    const data = await res.json();
    const apps: AppleRSSApp[] = data?.feed?.results ?? [];

    for (const app of apps) {
      const genre = app.genres?.[0]?.name ?? '기타';
      results.push({
        title: app.name,
        description: `${genre} 앱 - ${app.artistName} | iOS App Store 인기 무료 앱`,
        source: 'appstore',
        source_url: app.url,
        score: 0,
        comment_count: 0,
        raw_data: { appId: app.id, artistName: app.artistName, genre, store: 'apple_appstore' },
      });
    }
  } catch (err) {
    console.error('[AppStore] RSS fetch failed:', err instanceof Error ? err.message : err);
    return fetchAppStoreFallback();
  }

  return results;
}

async function fetchAppStoreFallback(): Promise<RawIdea[]> {
  // RSS 실패 시 빈 배열 반환 (외부 API 키 불필요)
  console.warn('[AppStore] Using fallback — returning empty results');
  return [];
}

export async function collectAppStore(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchAppStoreTrending);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
