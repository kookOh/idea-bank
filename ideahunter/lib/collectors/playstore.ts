import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import { collectWithRetry, deduplicateByField } from './utils';

async function fetchPlayStoreTrending(): Promise<RawIdea[]> {
  const categories = ['APPLICATION', 'GAME'];
  const results: RawIdea[] = [];

  for (const category of categories) {
    try {
      // Google Play의 비공식 API 엔드포인트 (RSS-like)
      const res = await fetchWithTimeout(
        `https://play.google.com/store/apps/collection/cluster?clp=ogoGCAEqAggB&hl=ko&gl=kr`,
        { headers: { 'Accept-Language': 'ko-KR,ko' } }
      );

      if (!res.ok) {
        console.error(`[PlayStore] HTTP ${res.status} for category "${category}"`);
        continue;
      }

      // HTML에서 앱 정보 추출 (정규식 기반 경량 파싱)
      const html = await res.text();
      const appPattern = /\/store\/apps\/details\?id=([\w.]+).*?class="[^"]*"[^>]*>([^<]+)/g;
      let match;
      const seen = new Set<string>();

      while ((match = appPattern.exec(html)) !== null) {
        const [, appId, title] = match;
        if (seen.has(appId)) continue;
        seen.add(appId);

        results.push({
          title: title.trim(),
          description: `${category === 'GAME' ? '게임' : '앱'} - Google Play 트렌딩`,
          source: 'playstore',
          source_url: `https://play.google.com/store/apps/details?id=${appId}`,
          score: 0,
          comment_count: 0,
          raw_data: { appId, category, store: 'google_play' },
        });
      }
    } catch (err) {
      console.error(`[PlayStore] Category "${category}" failed:`, err instanceof Error ? err.message : err);
    }
  }

  // HTML 파싱 결과가 없으면 웹 검색 fallback
  if (results.length === 0) {
    return fetchPlayStoreFallback();
  }

  return results;
}

async function fetchPlayStoreFallback(): Promise<RawIdea[]> {
  // HTML 파싱 실패 시 빈 배열 반환 (외부 API 키 불필요)
  console.warn('[PlayStore] Using fallback — returning empty results');
  return [];
}

export async function collectPlayStore(): Promise<RawIdea[]> {
  const items = await collectWithRetry(fetchPlayStoreTrending);
  return deduplicateByField(items, 'source_url').slice(0, 25);
}
