/**
 * Generates short, opaque, URL-safe identifiers for public user handles.
 *
 * Uses Web Crypto (available in Cloudflare Workers and all modern runtimes —
 * no Node.js `crypto` module dependency). A 10-character base62 slug provides
 * ~5.9 × 10^17 possibilities, making collisions vanishingly rare for any
 * realistic user base; callers should still catch UNIQUE constraint errors
 * at insert time and retry.
 */
export class PublicSlugGenerator {
  private static readonly ALPHABET =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  private static readonly DEFAULT_LENGTH = 10;

  static generate(length: number = PublicSlugGenerator.DEFAULT_LENGTH): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let out = "";
    for (const byte of bytes) {
      out += PublicSlugGenerator.ALPHABET[byte % 62];
    }
    return out;
  }
}
