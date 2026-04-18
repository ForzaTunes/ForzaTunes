export interface OgCarImageSource {
  imageKey?: string | null;
  imageUrl?: string | null;
}

/**
 * Loads a car image server-side and returns it as a PNG base64 data URL so
 * that workers-og/satori can embed it without having to issue its own fetch.
 *
 * Why not just hand satori the public `forzatunes.com/cdn-cgi/image/...` URL?
 * From inside a Worker running on the same zone, a subrequest to
 * `forzatunes.com/cdn-cgi/image/...` does not cleanly round-trip through
 * Cloudflare Image Resizing — satori/resvg receives a body it cannot decode
 * ("Unsupported image type: unknown"). The Workers-native equivalent is
 * `fetch(url, { cf: { image: ... } })` against the raw origin (R2's custom
 * domain on a different hostname), which produces a transformed PNG.
 */
export class OgImageLoader {
  private static readonly R2_PUBLIC_BASE = "https://images.forzatunes.com";
  private static readonly CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
  private static readonly cache = new Map<string, string>();

  private static readonly TRANSFORM = {
    width: 720,
    height: 720,
    fit: "cover",
    format: "png",
    quality: 90,
  } as const;

  static async loadCarDataUrl(source: OgCarImageSource): Promise<string | null> {
    const sourceUrl = OgImageLoader.resolveSourceUrl(source);
    if (!sourceUrl) return null;

    const cached = OgImageLoader.cache.get(sourceUrl);
    if (cached) return cached;

    try {
      const response = await fetch(sourceUrl, {
        cf: {
          image: OgImageLoader.TRANSFORM,
          cacheEverything: true,
          cacheTtl: OgImageLoader.CACHE_TTL_SECONDS,
        },
      } as RequestInit);

      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      const base64 = OgImageLoader.toBase64(buffer);
      const contentType = response.headers.get("content-type") ?? "image/png";
      const dataUrl = `data:${contentType};base64,${base64}`;
      OgImageLoader.cache.set(sourceUrl, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  }

  private static resolveSourceUrl(source: OgCarImageSource): string | null {
    if (source.imageKey) return `${OgImageLoader.R2_PUBLIC_BASE}/${source.imageKey}`;
    if (source.imageUrl) return source.imageUrl;
    return null;
  }

  private static toBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
}
