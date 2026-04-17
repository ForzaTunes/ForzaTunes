import { env } from "cloudflare:workers";
import { DatabaseClient } from "../db/DatabaseClient";
import { RateLimiter } from "./RateLimiter";
import { D1RateLimiter, type RateLimiterLike } from "./D1RateLimiter";

interface LimiterConfig {
  bucket: string;
  maxRequests: number;
  windowMs: number;
}

function makeLimiter(config: LimiterConfig): RateLimiterLike {
  if (import.meta.env.DEV || env.DEMO_MODE === "true") {
    return new RateLimiter(config.maxRequests, config.windowMs);
  }
  const db = new DatabaseClient(env.DB);
  return new D1RateLimiter(db, config.bucket, config.maxRequests, config.windowMs);
}

export const submitLimiter = makeLimiter({
  bucket: "submit",
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
});

export const starLimiter = makeLimiter({
  bucket: "star",
  maxRequests: 60,
  windowMs: 60 * 1000,
});

export const authLimiter = makeLimiter({
  bucket: "auth",
  maxRequests: 20,
  windowMs: 60 * 1000,
});

export const reportLimiter = makeLimiter({
  bucket: "report",
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
});
