/**
 * Caches generated OG PNGs directly in `caches.default` with a stable key
 * (no version counter) so the CPU-heavy satori+resvg render happens at most
 * once per unique OG URL until the TTL expires.
 */
export class OgCacheManager {
  private static readonly CACHE_HOST = "https://cache.internal";
  private static readonly TTL_SECONDS = 60 * 60 * 24 * 7;
  private static readonly CACHE_CONTROL =
    `public, max-age=300, s-maxage=${OgCacheManager.TTL_SECONDS}, stale-while-revalidate=604800`;

  static async tryServe(request: Request): Promise<Response | null> {
    const key = OgCacheManager.buildKey(request);
    const hit = await caches.default.match(key);
    if (hit) {
      console.log(`[OgCache] HIT ${new URL(request.url).pathname}`);
      return hit;
    }
    console.log(`[OgCache] MISS ${new URL(request.url).pathname}`);
    return null;
  }

  static async store(request: Request, response: Response): Promise<Response> {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", OgCacheManager.CACHE_CONTROL);
    headers.set("Content-Type", "image/png");
    const storable = new Response(response.clone().body, {
      status: response.status,
      headers,
    });
    try {
      await caches.default.put(OgCacheManager.buildKey(request), storable);
      console.log(`[OgCache] PUT ${new URL(request.url).pathname}`);
    } catch (err) {
      console.warn(`[OgCache] PUT failed`, err);
    }
    return new Response(response.body, { status: response.status, headers });
  }

  static notFound(message = "not found"): Response {
    return new Response(message, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  private static buildKey(request: Request): Request {
    const url = new URL(request.url);
    return new Request(`${OgCacheManager.CACHE_HOST}/og${url.pathname}`, {
      method: "GET",
    });
  }
}
