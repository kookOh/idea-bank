import { formatAitPrompt } from '@/lib/prompt-formatter';
import type { PlatformAnalysis } from '@/types/idea';

describe('formatAitPrompt', () => {
  const mockIdea = {
    title: 'AI Todo App',
    summary_ko: 'AI 기반 할일 관리 앱',
    tags: ['SaaS', 'AI', 'B2C'] as string[],
    recommended_stack: ['React', 'Supabase'] as string[],
    revenue_potential: 4,
    market_size: '글로벌 $5B',
  };

  const mockAnalysis: PlatformAnalysis = {
    ait_score: 85,
    ait_category: '유틸리티',
    ait_blocked_reason: null,
    ait_ad_revenue_estimate: '월 300만원 (DAU 5만 기준)',
    ait_target_type: 'webview',
  };

  test('모든 템플릿 변수가 채워짐', () => {
    const result = formatAitPrompt(mockIdea, mockAnalysis);

    expect(result).not.toContain('[INSERT_IDEA]');
    expect(result).not.toContain('[AIT_SCORE]');
    expect(result).not.toContain('[AIT_CATEGORY]');
    expect(result).not.toContain('[TARGET_TYPE]');
    expect(result).not.toContain('[BLOCKED_REASON]');
    expect(result).not.toContain('[PLATFORM_RATIONALE]');
    expect(result).not.toContain('[OPTIONAL_NAME]');
    expect(result).not.toContain('[TARGET_USERS]');
    expect(result).not.toContain('[MONETIZATION]');
    expect(result).not.toContain('[GOAL]');
    expect(result).not.toContain('[TEAM_SIZE]');
    expect(result).not.toContain('[TIMELINE]');
    expect(result).not.toContain('[LEAN_OR_NORMAL]');
  });

  test('아이디어 제목과 요약이 포함됨', () => {
    const result = formatAitPrompt(mockIdea, mockAnalysis);

    expect(result).toContain('AI Todo App');
    expect(result).toContain('AI 기반 할일 관리 앱');
  });

  test('적합도 점수가 포함됨', () => {
    const result = formatAitPrompt(mockIdea, mockAnalysis);

    expect(result).toContain('85');
    expect(result).toContain('유틸리티');
  });

  test('WebView 타입일 때 올바른 근거', () => {
    const result = formatAitPrompt(mockIdea, mockAnalysis);

    expect(result).toContain('webview');
    expect(result).toContain('WebView');
  });

  test('React Native 타입일 때 올바른 근거', () => {
    const rnAnalysis: PlatformAnalysis = {
      ...mockAnalysis,
      ait_target_type: 'react-native',
    };
    const result = formatAitPrompt(mockIdea, rnAnalysis);

    expect(result).toContain('react-native');
    expect(result).toContain('React Native');
  });

  test('10개 런칭 아티팩트 요청 포함', () => {
    const result = formatAitPrompt(mockIdea, mockAnalysis);

    expect(result).toContain('APPINTOSS_MASTER_BLUEPRINT.md');
    expect(result).toContain('PRD.md');
    expect(result).toContain('app-architecture.md');
    expect(result).toContain('launch-checklist.md');
    expect(result).toContain('api-spec.yaml');
    expect(result).toContain('schema.sql');
  });

  test('B2B 태그일 때 타겟 사용자 변경', () => {
    const b2bIdea = { ...mockIdea, tags: ['B2B'] as string[] };
    const result = formatAitPrompt(b2bIdea, mockAnalysis);

    expect(result).toContain('비즈니스 사용자');
  });

  test('광고 수익 추정이 포함됨', () => {
    const result = formatAitPrompt(mockIdea, mockAnalysis);

    expect(result).toContain('월 300만원');
  });

  test('차단된 아이디어도 포맷 가능', () => {
    const blockedAnalysis: PlatformAnalysis = {
      ...mockAnalysis,
      ait_blocked_reason: '금지 카테고리: 금융',
      ait_score: 0,
    };
    const result = formatAitPrompt(mockIdea, blockedAnalysis);

    expect(result).toContain('금지 카테고리: 금융');
  });
});
