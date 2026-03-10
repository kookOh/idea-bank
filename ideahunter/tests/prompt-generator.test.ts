import { generateImplementationPrompts } from '@/lib/ai/prompt-generator';

const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('generateImplementationPrompts', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    process.env.GROQ_API_KEY = 'test-key';
  });

  const mockIdea = {
    title: 'AI Todo App',
    summary_ko: 'AI 기반 할일 관리 앱',
    recommended_stack: ['Next.js', 'Supabase'],
    mvp_days: 7,
    tags: ['SaaS', 'AI'],
    revenue_potential: 4,
    market_size: '글로벌 $5B',
  };

  test('LLM 정상 응답 시 템플릿 기반 한국어 프롬프트 생성', async () => {
    const techDetails = {
      db_schema: '- todos: id, user_id, title, completed, created_at',
      api_endpoints: '- GET /api/todos: 할일 목록 조회',
      ui_screens: '- /: 메인 대시보드',
      core_features: '- AI 추천: 할일 우선순위 자동 정렬',
    };
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(techDetails) } }],
    });

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.project_name).toBe('ai-todo-app');
    expect(result.master_prompt).toContain('프로젝트 개요');
    expect(result.master_prompt).toContain('DB 스키마');
    expect(result.master_prompt).toContain('API 설계');
    expect(result.master_prompt).toContain('UI 화면');
    expect(result.master_prompt).toContain('AI 기반 할일 관리 앱');
    expect(result.master_prompt).toContain('todos');
    expect(result.phases).toHaveLength(5);
    expect(result.tech_stack).toEqual(['Next.js', 'Supabase']);
  });

  test('LLM이 잘못된 형식 반환 시 폴백 상세 사용', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'not json at all' } }],
    });

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.master_prompt).toContain('프로젝트 개요');
    expect(result.master_prompt).toContain('AI Todo App');
    // 폴백 DB 스키마 사용
    expect(result.master_prompt).toContain('users');
    expect(result.phases).toHaveLength(5);
  });

  test('API 에러 시 폴백 상세로 프롬프트 생성', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.project_name).toBe('ai-todo-app');
    expect(result.master_prompt).toContain('프로젝트 개요');
    expect(result.master_prompt).toContain('유료 서비스 절대 사용 금지');
    expect(result.phases).toHaveLength(5);
    expect(result.overview).toBe('AI 기반 할일 관리 앱');
  });

  test('overview에 summary_ko 사용', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
    });

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.overview).toBe('AI 기반 할일 관리 앱');
  });

  test('summary_ko 없으면 title 사용', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{}' } }],
    });

    const result = await generateImplementationPrompts({ title: 'Test App' });
    expect(result.overview).toBe('Test App');
    expect(result.master_prompt).toContain('Test App');
  });
});
