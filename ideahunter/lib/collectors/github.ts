import { RawIdea } from './index';

export async function collectGitHub(): Promise<RawIdea[]> {
  const topics = ['saas-boilerplate', 'ai-tools', 'indie-hacker', 'side-project'];
  const results: RawIdea[] = [];
  for (const topic of topics) {
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=topic:${topic}&sort=stars&per_page=10`,
        { headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );
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
    } catch {
      // skip failed topic
    }
  }
  return results;
}
