import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export async function collectProductHunt(): Promise<RawIdea[]> {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
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
  } catch {
    return [];
  }
}
