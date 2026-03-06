export type RawIdea = {
  title: string;
  description: string;
  source: string;
  source_url: string;
  score: number;
  comment_count: number;
  raw_data: any;
};

export { collectHackerNews } from './hackernews';
export { collectReddit } from './reddit';
export { collectProductHunt } from './producthunt';
export { collectGitHub } from './github';
