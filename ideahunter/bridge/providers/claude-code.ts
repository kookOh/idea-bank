import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildPrompt, parseCliResponse } from '../prompt-builder';
import type { GenerateRequest, GenerateResult } from '../types';

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 60_000;

export async function detectClaudeCode(): Promise<boolean> {
  try {
    await execFileAsync('claude', ['--version'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function generateWithClaudeCode(
  req: GenerateRequest
): Promise<GenerateResult> {
  const prompt = buildPrompt(req);

  const { stdout } = await execFileAsync(
    'claude',
    ['-p', prompt, '--output-format', 'text'],
    {
      timeout: TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, CLAUDE_CODE_DISABLE_NONESSENTIAL: '1' },
    }
  );

  const parsed = parseCliResponse(stdout.trim());
  return { ...parsed, provider: 'claude-code' };
}
