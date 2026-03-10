export interface Idea {
  id: string;
  title: string;
  description: string | null;
  source: 'hackernews' | 'reddit' | 'producthunt' | 'github' | 'playstore' | 'appstore';
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
  generated_prompts: GeneratedPrompts | { default?: GeneratedPrompts; appintoss?: GeneratedPrompts } | null;
  implementation_status: 'pending' | 'generating' | 'done' | 'error';
  raw_data: Record<string, unknown> | null;
  platform_analysis?: PlatformAnalysis | null;
}

export interface PlatformAnalysis {
  ait_score: number;
  ait_category: string;
  ait_blocked_reason: string | null;
  ait_ad_revenue_estimate: string;
  ait_target_type: 'webview' | 'react-native';
}

export interface GeneratedPrompts {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: { step: number; title: string; prompt: string }[];
  tech_stack: string[];
  free_services: string[];
}

export interface AitGeneratedPrompts extends GeneratedPrompts {
  platform_type: 'webview' | 'react-native';
  improvement_points: string[];
  marketing_strategy: string;
}

export interface Digest {
  id: string;
  date: string;
  top_ideas: Idea[];
  hot_topics: string[];
  market_insights: string;
  generated_at: string;
}
