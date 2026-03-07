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
  };

  test('정상 응답 시 모든 필드 반환', async () => {
    const response = {
      project_name: 'ai-todo',
      overview: 'AI 기반 할일 관리',
      master_prompt: 'Create an AI-powered todo app with Next.js and Supabase...',
      phases: [{ step: 1, title: '초기화', prompt: 'npm init' }],
      tech_stack: ['Next.js', 'Supabase'],
      free_services: ['Vercel', 'Supabase free'],
    };
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(response) } }],
    });

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.project_name).toBe('ai-todo');
    expect(result.master_prompt).toContain('AI-powered');
    expect(result.phases).toHaveLength(1);
    expect(result.tech_stack).toEqual(['Next.js', 'Supabase']);
  });

  test('빈 master_prompt 응답', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ project_name: 'test', master_prompt: '' }) } }],
    });

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.master_prompt).toBe('');
    expect(result.phases).toEqual([]);
  });

  test('API 에러 시 폴백', async () => {
    mockCreate.mockRejectedValue(new Error('timeout'));

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.master_prompt).toBe('');
    expect(result.project_name).toBe('my-project');
  });

  test('부분 JSON 응답 시 기본값 보충', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"project_name":"partial","master_prompt":"do stuff"}' } }],
    });

    const result = await generateImplementationPrompts(mockIdea);
    expect(result.project_name).toBe('partial');
    expect(result.master_prompt).toBe('do stuff');
    expect(result.phases).toEqual([]);
    expect(result.tech_stack).toEqual([]);
    expect(result.free_services).toEqual([]);
  });
});
