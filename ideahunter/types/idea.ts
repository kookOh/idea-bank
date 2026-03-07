export interface Idea {
  id: string;
  title: string;
  description: string | null;
  source: 'hackernews' | 'reddit' | 'producthunt' | 'github';
  source_url: string;
  score: number;
  comment_count: number;
  collected_at: string;
  summary_ko: string | null;
  market_size: string | null;
  difficulty: number | null;
  revenue_potential: number | null;
  competition: number | null;
  recommended_stack: string[] | null;
  mvp_days: number | null;
  tags: string[] | null;
  trend_score: number;
  generated_prompts: GeneratedPrompts | null;
  implementation_status: 'pending' | 'generating' | 'done' | 'error';
  raw_data: Record<string, unknown> | null;
}

export interface GeneratedPrompts {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: { step: number; title: string; prompt: string }[];
  tech_stack: string[];
  free_services: string[];
}

export interface Digest {
  id: string;
  date: string;
  top_ideas: Idea[];
  hot_topics: string[];
  market_insights: string;
  generated_at: string;
}
