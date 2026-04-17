import type { WikiImage } from "./wiki-api.js";

type VariantRank = number;

const VARIANT_PRIORITY: Record<string, VariantRank> = {
  main: 0,
  large: 1,
  promo: 2,
  small: 3,
  other: 4,
};

const VARIANT_SUFFIX_RE =
  /_(Small|Large|Promo(?:_\d+)?|Front|Rear|Hi_Car|Low_Car|Lo_Car|Rally_Adventure)$/i;

interface IndexedImage {
  url: string;
  rank: VariantRank;
}

export class WikiImageIndex {
  private readonly map = new Map<string, IndexedImage>();

  constructor(prefix: string, images: WikiImage[]) {
    const stripPrefix = new RegExp(`^${prefix}_`, "i");
    const extRe = /\.(png|jpe?g)$/i;

    for (const img of images) {
      if (!extRe.test(img.name)) continue;

      const noPrefix = img.name.replace(stripPrefix, "");
      if (noPrefix === img.name) continue;

      const noExt = noPrefix.replace(extRe, "");
      const { base, rank } = WikiImageIndex.splitVariant(noExt);
      const key = WikiImageIndex.normalize(base);
      if (!key) continue;

      const existing = this.map.get(key);
      if (!existing || rank < existing.rank) {
        this.map.set(key, { url: img.url, rank });
      }
    }
  }

  lookup(candidates: Array<string | undefined | null>): string | null {
    for (const candidate of candidates) {
      if (!candidate) continue;
      const key = WikiImageIndex.normalize(candidate);
      if (!key) continue;
      const hit = this.map.get(key);
      if (hit) return hit.url;
    }
    return null;
  }

  get size(): number {
    return this.map.size;
  }

  private static splitVariant(noExt: string): { base: string; rank: VariantRank } {
    const match = noExt.match(VARIANT_SUFFIX_RE);
    if (!match) return { base: noExt, rank: VARIANT_PRIORITY.main };

    const tag = match[1].toLowerCase().replace(/_\d+$/, "");
    const normalizedTag = tag.startsWith("promo") ? "promo" : tag;
    const rank =
      VARIANT_PRIORITY[normalizedTag as keyof typeof VARIANT_PRIORITY] ??
      VARIANT_PRIORITY.other;

    const base = noExt.slice(0, match.index).trim();
    return { base, rank };
  }

  static normalize(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/['"`\u2018\u2019\u201c\u201d]/g, "")
      .replace(/[()[\]{}]/g, " ")
      .replace(/[\/:#_\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
