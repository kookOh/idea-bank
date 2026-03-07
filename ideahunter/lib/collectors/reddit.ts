import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export async function collectReddit(): Promise<RawIdea[]> {
  const subreddits = [
    { sub: 'SideProject', sort: 'hot' },
    { sub: 'startups', sort: 'hot' },
    { sub: 'entrepreneur', sort: 'hot' },
    { sub: 'indiehackers', sort: 'new' },
    { sub: 'AppIdeas', sort: 'top' },
  ];
  const results: RawIdea[] = [];

  for (const { sub, sort } of subreddits) {
    try {
      const res = await fetchWithTimeout(
        `https://www.reddit.com/r/${sub}/${sort}.json?limit=25`,
        { headers: { 'User-Agent': 'IdeaHunter/1.0' } }
      );
      const data = await res.json();
      for (const post of data.data?.children ?? []) {
        const p = post.data;
        if (p.score < 5) continue;
        results.push({
          title: p.title,
          description: p.selftext?.slice(0, 500) ?? '',
          source: 'reddit',
          source_url: `https://reddit.com${p.permalink}`,
          score: p.score,
          comment_count: p.num_comments,
          raw_data: p,
        });
      }
    } catch {
      // skip failed subreddit
    }
  }
  return results;
}
