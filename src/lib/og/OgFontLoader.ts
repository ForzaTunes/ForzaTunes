export type OgFontWeight = 400 | 700 | 800;
export type OgFontStyle = "normal" | "italic";

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: OgFontWeight;
  style: OgFontStyle;
}

interface FontSpec {
  filename: string;
  weight: OgFontWeight;
  style: OgFontStyle;
}

export class OgFontLoader {
  private static readonly FONT_FAMILY = "Exo 2";
  private static readonly FONT_BASE = "https://images.forzatunes.com/fonts";
  private static readonly FONT_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

  private static readonly SPECS: readonly FontSpec[] = [
    { filename: "Exo2-Regular.woff", weight: 400, style: "normal" },
    { filename: "Exo2-Bold.woff", weight: 700, style: "normal" },
    { filename: "Exo2-ExtraBoldItalic.woff", weight: 800, style: "italic" },
  ];

  private static readonly cache: Map<string, ArrayBuffer> = new Map();

  static async load(): Promise<OgFont[]> {
    const entries = await Promise.all(
      OgFontLoader.SPECS.map(async (spec) => ({
        spec,
        data: await OgFontLoader.fetchFont(spec.filename),
      })),
    );

    return entries.map(({ spec, data }) => ({
      name: OgFontLoader.FONT_FAMILY,
      data,
      weight: spec.weight,
      style: spec.style,
    }));
  }

  private static async fetchFont(filename: string): Promise<ArrayBuffer> {
    const cached = OgFontLoader.cache.get(filename);
    if (cached) return cached;

    const response = await fetch(`${OgFontLoader.FONT_BASE}/${filename}`, {
      cf: {
        cacheEverything: true,
        cacheTtl: OgFontLoader.FONT_CACHE_TTL_SECONDS,
      },
    } as RequestInit);

    if (!response.ok) {
      throw new Error(
        `Failed to load OG font ${filename}: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.arrayBuffer();
    OgFontLoader.cache.set(filename, data);
    return data;
  }
}
