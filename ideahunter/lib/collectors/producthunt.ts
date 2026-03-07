import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export async function collectProductHunt(): Promise<RawIdea[]> {
  if (!process.env.PRODUCTHUNT_API_TOKEN) {
    console.warn('[ProductHunt] PRODUCTHUNT_API_TOKEN not set, skipping');
    return [];
  }

  const query = `{
    posts(first: 20, order: VOTES) {
      edges { node {
        id name tagline description votesCount commentsCount
        website
        topics { edges { node { name } } }
      }}
    }
  }`;
  try {
    const res = await fetchWithTimeout('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PRODUCTHUNT_API_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      console.error(`[ProductHunt] API error: ${res.status} ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return (data.data?.posts?.edges ?? []).map(({ node: p }: any) => ({
      title: p.name,
      description: `${p.tagline}\n${p.description ?? ''}`.slice(0, 500),
      source: 'producthunt' as const,
      source_url: p.website ?? '',
      score: p.votesCount,
      comment_count: p.commentsCount,
      raw_data: p,
    }));
  } catch (err) {
    console.error('[ProductHunt] Collection failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
