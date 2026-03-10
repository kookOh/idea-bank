import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildPrompt, parseCliResponse } from '../prompt-builder';
import type { GenerateRequest, GenerateResult } from '../types';

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 60_000;

export async function detectCodex(): Promise<boolean> {
  try {
    await execFileAsync('codex', ['--version'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function generateWithCodex(
  req: GenerateRequest
): Promise<GenerateResult> {
  const prompt = buildPrompt(req);

  const { stdout } = await execFileAsync(
    'codex',
    ['--quiet', '--approval-mode', 'suggest', '--', prompt],
    {
      timeout: TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    }
  );

  const parsed = parseCliResponse(stdout.trim());
  return { ...parsed, provider: 'codex' };
}
