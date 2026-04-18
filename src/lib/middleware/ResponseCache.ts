import type { ICacheVersionManager } from "./CacheVersionManager";
import { SessionManager } from "../auth/SessionManager";

export type CacheStatus = "HIT" | "MISS" | "BYPASS" | "SKIP";

export interface CacheOutcome {
  status: CacheStatus;
  reason?: string;
}

/**
 * Edge-cache facade for SSR page responses.
 *
 * Handles the "should this request be served from cache / stored in cache"
 * decision in one place. Keys are versioned via {@link ICacheVersionManager}
 * so a single `bump()` on any write invalidates every cached URL globally.
 *
 * Bypass rules (no read, no write):
 *   - non-GET requests
 *   - excluded path prefixes (api, auth, profile, submit, edit)
 *   - requests carrying a session cookie (logged-in users always get fresh)
 *
 * Skip rules (read attempt happened, but don't store this response):
 *   - non-200 status
 *   - response sets a cookie
 *   - response lacks `s-maxage` in Cache-Control
 *
 * Always writes a `x-ft-cache` response header for visibility in devtools.
 */
export class ResponseCache {
  private static readonly HEADER = "x-ft-cache";
  private static readonly INTERNAL_HOST = "https://cache.internal";
  private static readonly EXCLUDED_PREFIXES: readonly string[] = [
    "/api/",
    "/auth/",
    "/profile",
    "/submit",
  ];
  private static readonly EXCLUDED_SUFFIXES: readonly string[] = ["/edit"];

  constructor(
    private readonly versions: ICacheVersionManager,
    private readonly cache: Cache = caches.default,
  ) {}

  async tryServeFromCache(request: Request): Promise<Response | null> {
    const bypass = this.getBypassReason(request);
    if (bypass) return null;

    const key = await this.buildCacheKey(request);
    const cached = await this.cache.match(key);
    if (!cached) return null;

    return this.withStatusHeader(cached, { status: "HIT" });
  }

  async finalize(request: Request, response: Response): Promise<Response> {
    const bypass = this.getBypassReason(request);
    if (bypass) {
      return this.withStatusHeader(response, {
        status: "BYPASS",
        reason: bypass,
      });
    }

    const skip = this.getSkipReason(response);
    if (skip) {
      return this.withStatusHeader(response, {
        status: "SKIP",
        reason: skip,
      });
    }

    const key = await this.buildCacheKey(request);
    const storable = response.clone();
    try {
      await this.cache.put(key, storable);
    } catch (err) {
      console.warn("[ResponseCache] put failed:", err);
    }

    return this.withStatusHeader(response, { status: "MISS" });
  }

  private getBypassReason(request: Request): string | null {
    if (request.method !== "GET") return "method";
    const url = new URL(request.url);
    if (this.isExcludedPath(url.pathname)) return "path";
    if (this.hasSessionCookie(request)) return "session";
    return null;
  }

  private getSkipReason(response: Response): string | null {
    if (response.status !== 200) return "status";
    if (response.headers.has("set-cookie")) return "set-cookie";
    const cacheControl = response.headers.get("cache-control") ?? "";
    if (this.parseSMaxAge(cacheControl) <= 0) return "no-s-maxage";
    return null;
  }

  private isExcludedPath(pathname: string): boolean {
    for (const prefix of ResponseCache.EXCLUDED_PREFIXES) {
      if (pathname.startsWith(prefix)) return true;
    }
    for (const suffix of ResponseCache.EXCLUDED_SUFFIXES) {
      if (pathname.endsWith(suffix)) return true;
    }
    return false;
  }

  private hasSessionCookie(request: Request): boolean {
    const header = request.headers.get("cookie");
    if (!header) return false;
    return header.includes(`${SessionManager.COOKIE_NAME}=`);
  }

  private async buildCacheKey(request: Request): Promise<Request> {
    const version = await this.versions.getVersion();
    const url = new URL(request.url);
    const synthetic = `${ResponseCache.INTERNAL_HOST}/v1/${version}${url.pathname}${url.search}`;
    return new Request(synthetic, { method: "GET" });
  }

  private parseSMaxAge(cacheControl: string): number {
    const match = cacheControl.match(/s-maxage\s*=\s*(\d+)/i);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  private withStatusHeader(response: Response, outcome: CacheOutcome): Response {
    const label = outcome.reason
      ? `${outcome.status}:${outcome.reason}`
      : outcome.status;
    const headers = new Headers(response.headers);
    headers.set(ResponseCache.HEADER, label);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}
