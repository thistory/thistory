/**
 * In-memory sliding window rate limiter.
 * No external dependencies — suitable for single-instance deployments (Vercel serverless).
 *
 * For multi-instance deployments, replace with Redis-based solution (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Periodic cleanup to prevent memory leaks (every 60s)
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter((t) => now - t < 3600_000);
        if (entry.timestamps.length === 0) store.delete(key);
      }
    }
  }, 60_000).unref();
}

export function createRateLimiter(name: string, options: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();
  stores.set(name, store);
  scheduleCleanup();

  return {
    /**
     * Check if the key is rate limited.
     * Returns { success: true } if allowed, { success: false, retryAfterMs } if blocked.
     */
    check(key: string): { success: boolean; retryAfterMs?: number } {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry) {
        store.set(key, { timestamps: [now] });
        return { success: true };
      }

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter(
        (t) => now - t < options.windowMs
      );

      if (entry.timestamps.length >= options.limit) {
        const oldest = entry.timestamps[0];
        const retryAfterMs = options.windowMs - (now - oldest);
        return { success: false, retryAfterMs };
      }

      entry.timestamps.push(now);
      return { success: true };
    },
  };
}

// Pre-configured rate limiters for critical endpoints
export const chatLimiter = createRateLimiter("chat", {
  limit: 20,
  windowMs: 60_000, // 20 req/min per user
});

export const signupLimiter = createRateLimiter("signup", {
  limit: 5,
  windowMs: 3600_000, // 5 req/hour per IP
});

export const authLimiter = createRateLimiter("auth", {
  limit: 10,
  windowMs: 60_000, // 10 req/min per IP
});
