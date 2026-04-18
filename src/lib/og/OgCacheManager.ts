/**
 * Applies OG-specific cache policy to generated PNG responses.
 *
 * Actual edge caching is performed by the middleware's
 * {@link import("../middleware/ResponseCache").ResponseCache}, which respects
 * `s-maxage` on responses. This class centralizes the cache-control header
 * so OG cards share one TTL policy, and OG-level changes don't touch the
 * generic page cache code path.
 */
export class OgCacheManager {
  private static readonly CACHE_CONTROL =
    "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800";

  static applyTo(response: Response): Response {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", OgCacheManager.CACHE_CONTROL);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  static notFound(message = "not found"): Response {
    return new Response(message, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
