import type { RateLimiterLike } from "./D1RateLimiter";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter.
 *
 * NOTE: On Cloudflare Workers, isolates are ephemeral and counters do not
 * survive across them. This is a best-effort local/dev fallback only.
 * For production rate limiting, prefer D1RateLimiter or Cloudflare's
 * native rate limiting rules.
 */
export class RateLimiter implements RateLimiterLike {
  private maxRequests: number;
  private windowMs: number;
  private entries = new Map<string, RateLimitEntry>();

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async check(key: string): Promise<boolean> {
    const now = Date.now();

    if (this.entries.size > 1000) {
      for (const [k, e] of this.entries) {
        if (now > e.resetAt) this.entries.delete(k);
      }
    }

    const entry = this.entries.get(key);

    if (!entry || now > entry.resetAt) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }
}
