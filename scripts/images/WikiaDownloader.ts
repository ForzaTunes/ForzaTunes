import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";

export interface DownloadedImage {
  body: Buffer;
  contentType: string;
  extension: string;
}

export interface DownloadRequest {
  sourceUrl: string | null;
  fallbackId: string;
}

export class WikiaDownloader {
  private static readonly USER_AGENT =
    "ForzaTunesImageMigrator/1.0 (+https://forzatunes.com)";
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  private static readonly CONTENT_TYPE_EXT: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };

  constructor(private readonly fallbackDir: string) {}

  async download(request: DownloadRequest): Promise<DownloadedImage> {
    const local = await this.tryLocalFallback(request.fallbackId);
    if (local) return local;

    if (!request.sourceUrl) {
      throw new Error(
        `No source URL and no fallback found for ${request.fallbackId}`,
      );
    }

    return this.fetchRemote(request.sourceUrl);
  }

  private async tryLocalFallback(
    fallbackId: string,
  ): Promise<DownloadedImage | null> {
    if (!existsSync(this.fallbackDir)) return null;

    const candidates = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];
    for (const ext of candidates) {
      const path = join(this.fallbackDir, `${fallbackId}${ext}`);
      if (!existsSync(path)) continue;
      const body = await readFile(path);
      const normalizedExt = ext === ".jpeg" ? "jpg" : ext.slice(1);
      return {
        body,
        contentType: this.extensionToContentType(normalizedExt),
        extension: normalizedExt,
      };
    }
    return null;
  }

  private async fetchRemote(url: string): Promise<DownloadedImage> {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= WikiaDownloader.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { "user-agent": WikiaDownloader.USER_AGENT },
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} for ${url}`);
        }
        const rawContentType =
          response.headers.get("content-type") ?? "image/png";
        const contentType = (rawContentType.split(";")[0] ?? "image/png")
          .trim()
          .toLowerCase();
        const extension =
          WikiaDownloader.CONTENT_TYPE_EXT[contentType] ??
          this.extensionFromUrl(url) ??
          "png";
        const body = Buffer.from(await response.arrayBuffer());
        return { body, contentType, extension };
      } catch (error) {
        lastError = error;
        if (attempt < WikiaDownloader.MAX_RETRIES) {
          await this.delay(WikiaDownloader.RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw new Error(
      `Failed to fetch ${url} after ${WikiaDownloader.MAX_RETRIES} attempts: ${String(lastError)}`,
    );
  }

  private extensionFromUrl(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const ext = extname(pathname).slice(1).toLowerCase();
      if (ext === "jpeg") return "jpg";
      if (["png", "jpg", "webp", "gif", "avif"].includes(ext)) return ext;
      return null;
    } catch {
      return null;
    }
  }

  private extensionToContentType(ext: string): string {
    for (const [ct, e] of Object.entries(WikiaDownloader.CONTENT_TYPE_EXT)) {
      if (e === ext) return ct;
    }
    return "application/octet-stream";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
