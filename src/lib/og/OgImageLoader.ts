export interface OgCarImageSource {
  imageKey?: string | null;
  imageUrl?: string | null;
}

/**
 * Loads car images as base64 PNG data URLs for workers-og/satori.
 * Uses `cf.image` for transforms, with edge + in-memory caching.
 */
export class OgImageLoader {
  private static readonly R2_PUBLIC_BASE = "https://images.forzatunes.com";
  private static readonly CACHE_HOST = "https://cache.internal";
  private static readonly CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
  private static readonly TRANSFORM_OPTS = {
    width: 780,
    height: 780,
    fit: "cover",
    format: "png",
    quality: 80,
  } as const;

  private static readonly memoryCache = new Map<string, string>();

  static async loadCarDataUrl(
    source: OgCarImageSource,
  ): Promise<string | null> {
    const imageKey = source.imageKey ?? null;
    if (!imageKey) {
      console.log(`[OgImageLoader] no imageKey, skipping`);
      return null;
    }

    const memo = OgImageLoader.memoryCache.get(imageKey);
    if (memo) {
      console.log(`[OgImageLoader] memory-cache HIT for ${imageKey}`);
      return memo;
    }

    try {
      const buffer = await OgImageLoader.fetchTransformedPng(imageKey);
      if (!buffer) return null;

      const dataUrl = `data:image/png;base64,${OgImageLoader.toBase64(buffer)}`;
      OgImageLoader.memoryCache.set(imageKey, dataUrl);
      console.log(
        `[OgImageLoader] dataUrl ready for ${imageKey} (${buffer.byteLength} bytes)`,
      );
      return dataUrl;
    } catch (err) {
      console.error(`[OgImageLoader] unexpected error for ${imageKey}`, err);
      return null;
    }
  }

  private static async fetchTransformedPng(
    imageKey: string,
  ): Promise<ArrayBuffer | null> {
    const cache = caches.default;
    const cacheKey = OgImageLoader.buildCacheKey(imageKey);

    const hit = await cache.match(cacheKey);
    if (hit) {
      const buf = await hit.arrayBuffer();
      console.log(
        `[OgImageLoader] edge-cache HIT for ${imageKey} (${buf.byteLength} bytes)`,
      );
      return buf;
    }
    console.log(`[OgImageLoader] edge-cache MISS for ${imageKey}, transforming`);

    const originUrl = `${OgImageLoader.R2_PUBLIC_BASE}/${imageKey}`;
    console.log(`[OgImageLoader] fetching ${originUrl} with cf.image transform`);
    const response = await fetch(originUrl, {
      cf: { image: OgImageLoader.TRANSFORM_OPTS },
    } as RequestInit);

    console.log(
      `[OgImageLoader] response: ${response.status} ${response.statusText}, ` +
        `content-type=${response.headers.get("content-type")}, ` +
        `content-length=${response.headers.get("content-length")}`,
    );

    if (!response.ok) {
      console.error(
        `[OgImageLoader] transform failed (${response.status}) for ${originUrl}`,
      );
      return null;
    }

    const buffer = await response.arrayBuffer();
    console.log(
      `[OgImageLoader] body: ${buffer.byteLength} bytes for ${imageKey}`,
    );

    if (buffer.byteLength === 0) {
      console.error(`[OgImageLoader] empty body for ${originUrl}`);
      return null;
    }

    try {
      await cache.put(
        cacheKey,
        new Response(buffer.slice(0), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": `public, max-age=${OgImageLoader.CACHE_TTL_SECONDS}, s-maxage=${OgImageLoader.CACHE_TTL_SECONDS}, immutable`,
          },
        }),
      );
      console.log(`[OgImageLoader] edge-cache PUT ok for ${imageKey}`);
    } catch (err) {
      console.warn(`[OgImageLoader] cache.put failed for ${imageKey}`, err);
    }

    return buffer;
  }

  private static buildCacheKey(imageKey: string): Request {
    const safeKey = encodeURIComponent(imageKey);
    return new Request(
      `${OgImageLoader.CACHE_HOST}/og/car/v1/${safeKey}.png`,
      { method: "GET" },
    );
  }

  private static toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const CHUNK = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.subarray(i, i + CHUNK);
      binary += String.fromCharCode.apply(null, slice as unknown as number[]);
    }
    return btoa(binary);
  }
}
