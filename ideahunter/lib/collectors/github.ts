import { RawIdea } from './index';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export async function collectGitHub(): Promise<RawIdea[]> {
  const topics = ['saas-boilerplate', 'ai-tools', 'indie-hacker', 'side-project', 'app', 'mobile', 'web-app'];
  const results: RawIdea[] = [];

  // 최근 7일간 생성된 프로젝트 중 star 급증 필터
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  for (const topic of topics) {
    try {
      const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
      if (process.env.GITHUB_API_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_API_TOKEN}`;
      }
      const res = await fetchWithTimeout(
        `https://api.github.com/search/repositories?q=topic:${topic}+created:>${weekAgo}&sort=stars&per_page=10`,
        { headers }
      );
      if (!res.ok) {
        console.error(`[GitHub] HTTP ${res.status} for topic "${topic}"`);
        continue;
      }
      const data = await res.json();
      for (const repo of data.items ?? []) {
        results.push({
          title: repo.full_name,
          description: repo.description ?? '',
          source: 'github',
          source_url: repo.html_url,
          score: repo.stargazers_count,
          comment_count: repo.open_issues_count,
          raw_data: repo,
        });
      }
    } catch (err) {
      console.error(`[GitHub] Topic "${topic}" failed:`, err instanceof Error ? err.message : err);
    }
  }
  return results;
}
