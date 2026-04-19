export interface OgCarImageSource {
  imageKey?: string | null;
  imageUrl?: string | null;
}

/**
 * Loads a car image server-side and returns it as a PNG base64 data URL so
 * that workers-og/satori can embed it without having to issue its own fetch.
 */
export class OgImageLoader {
  private static readonly R2_HOST = "https://images.forzatunes.com";
  private static readonly TRANSFORM_OPTS =
    "width=1080,height=1080,format=png,quality=90";

  private static readonly cache = new Map<string, string>();

  static async loadCarDataUrl(
    source: OgCarImageSource,
  ): Promise<string | null> {
    const transformUrl = OgImageLoader.resolveTransformUrl(source);
    if (!transformUrl) return null;

    const cached = OgImageLoader.cache.get(transformUrl);
    if (cached) return cached;

    try {
      const response = await fetch(transformUrl);
      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();
      const dataUrl = `data:image/png;base64,${OgImageLoader.toBase64(buffer)}`;
      OgImageLoader.cache.set(transformUrl, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  }

  private static resolveTransformUrl(
    source: OgCarImageSource,
  ): string | null {
    if (!source.imageKey) return null;
    return `${OgImageLoader.R2_HOST}/cdn-cgi/image/${OgImageLoader.TRANSFORM_OPTS}/${source.imageKey}`;
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
