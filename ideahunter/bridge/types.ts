export interface IdeaInput {
  title: string;
  summary_ko?: string | null;
  recommended_stack?: string[] | null;
  mvp_days?: number | null;
  tags?: string[] | null;
  revenue_potential?: number | null;
  market_size?: string | null;
}

export interface GenerateRequest {
  idea: IdeaInput;
  platform?: 'appintoss';
}

export interface GenerateResult {
  project_name: string;
  overview: string;
  master_prompt: string;
  phases: { step: number; title: string; prompt: string }[];
  tech_stack: string[];
  free_services: string[];
  provider: 'claude-code' | 'codex' | 'groq';
}

export type ProviderName = 'claude-code' | 'codex';

export interface ProviderStatus {
  name: ProviderName;
  available: boolean;
}
