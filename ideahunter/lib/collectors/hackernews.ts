import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export async function collectHackerNews(): Promise<RawIdea[]> {
  const queries = ['show hn', 'ask hn revenue', 'launched saas', 'side project profit'];
  const results: RawIdea[] = [];

  for (const q of queries) {
    try {
      const res = await fetchWithTimeout(
        `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=20&numericFilters=points>10`
      );
      if (!res.ok) {
        console.error(`[HackerNews] HTTP ${res.status} for query "${q}"`);
        continue;
      }
      const data = await res.json();
      for (const hit of data.hits ?? []) {
        results.push({
          title: hit.title,
          description: hit.story_text?.slice(0, 500) ?? '',
          source: 'hackernews',
          source_url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
          score: hit.points,
          comment_count: hit.num_comments,
          raw_data: hit,
        });
      }
    } catch (err) {
      console.error(`[HackerNews] Query "${q}" failed:`, err instanceof Error ? err.message : err);
    }
  }
  return results;
}
