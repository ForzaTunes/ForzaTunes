-- Persistent rate limiter storage (D1-backed).
-- Replaces unreliable in-memory Map counters, which do not survive
-- across Cloudflare Worker isolates.

CREATE TABLE rate_limits (
  bucket TEXT NOT NULL,
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, key)
);

CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
