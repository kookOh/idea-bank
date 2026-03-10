import { detectClaudeCode, generateWithClaudeCode } from './claude-code';
import { detectCodex, generateWithCodex } from './codex-cli';
import type { GenerateRequest, GenerateResult, ProviderStatus } from '../types';

const providers = [
  {
    name: 'claude-code' as const,
    detect: detectClaudeCode,
    generate: generateWithClaudeCode,
  },
  {
    name: 'codex' as const,
    detect: detectCodex,
    generate: generateWithCodex,
  },
];

// CLI detection 캐싱 (60초 TTL)
let cachedProviders: ProviderStatus[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

export async function detectAvailableProviders(): Promise<ProviderStatus[]> {
  if (cachedProviders && Date.now() - cacheTime < CACHE_TTL) {
    return cachedProviders;
  }
  cachedProviders = await Promise.all(
    providers.map(async (p) => ({
      name: p.name,
      available: await p.detect(),
    }))
  );
  cacheTime = Date.now();
  return cachedProviders;
}

export async function generateWithFallback(
  req: GenerateRequest
): Promise<GenerateResult> {
  const errors: { provider: string; error: string }[] = [];
  const available = await detectAvailableProviders();

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    if (!available[i].available) {
      console.log(`[bridge] ${provider.name} not available, skipping`);
      errors.push({ provider: provider.name, error: 'CLI not installed' });
      continue;
    }

    try {
      console.log(`[bridge] Trying ${provider.name}...`);
      const result = await provider.generate(req);
      if (!result.master_prompt) {
        throw new Error('Empty master_prompt returned');
      }
      console.log(`[bridge] ${provider.name} succeeded`);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[bridge] ${provider.name} failed: ${msg}`);
      errors.push({ provider: provider.name, error: msg });
    }
  }

  throw new Error(
    `All providers failed:\n${errors.map((e) => `  - ${e.provider}: ${e.error}`).join('\n')}`
  );
}
