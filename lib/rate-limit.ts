/**
 * In-memory rate limiter for API routes.
 */
interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export function checkRateLimit(
  namespace: string,
  key: string | number,
  options: RateLimitOptions = {},
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 10;
  const now = Date.now();

  let namespaceStore = stores.get(namespace);

  if (!namespaceStore) {
    namespaceStore = new Map<string, RateLimitRecord>();
    stores.set(namespace, namespaceStore);
  }

  // Periodic cleanup if store grows
  if (namespaceStore.size > 5000) {
    namespaceStore.forEach((val, k) => {
      if (val.resetAt <= now) {
        namespaceStore.delete(k);
      }
    });
  }

  const strKey = String(key);
  const current = namespaceStore.get(strKey);

  if (!current || now >= current.resetAt) {
    namespaceStore.set(strKey, {
      count: 1,
      resetAt: now + windowMs,
    });

    return { allowed: true, remaining: max - 1 };
  }

  if (current.count >= max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  current.count += 1;

  return { allowed: true, remaining: max - current.count };
}
