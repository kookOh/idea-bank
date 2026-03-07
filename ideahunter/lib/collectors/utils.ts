export async function collectWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export function deduplicateByField<T>(items: T[], field: keyof T): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const value = item[field];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
