import type { DatabaseClient } from "../db/DatabaseClient";

export interface RateLimiterLike {
  check(key: string): Promise<boolean>;
}

export class D1RateLimiter implements RateLimiterLike {
  constructor(
    private readonly db: DatabaseClient,
    private readonly bucket: string,
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  async check(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    await this.db.execute(
      `DELETE FROM rate_limits WHERE bucket = ? AND window_start < ?`,
      [this.bucket, windowStart],
    );

    const existing = await this.db.queryOne<{
      window_start: number;
      count: number;
    }>(
      `SELECT window_start, count FROM rate_limits WHERE bucket = ? AND key = ?`,
      [this.bucket, key],
    );

    if (!existing || existing.window_start < windowStart) {
      await this.db.execute(
        `INSERT INTO rate_limits (bucket, key, window_start, count)
         VALUES (?, ?, ?, 1)
         ON CONFLICT (bucket, key) DO UPDATE SET
           window_start = excluded.window_start,
           count = 1`,
        [this.bucket, key, now],
      );
      return true;
    }

    if (existing.count >= this.maxRequests) {
      return false;
    }

    await this.db.execute(
      `UPDATE rate_limits SET count = count + 1
       WHERE bucket = ? AND key = ?`,
      [this.bucket, key],
    );
    return true;
  }
}
