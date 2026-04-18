import { readFile, writeFile } from "node:fs/promises";
import { v4 as uuidv4 } from "uuid";
import type { R2ImageUploader } from "./R2ImageUploader";
import type { WikiaDownloader } from "./WikiaDownloader";

export interface CarRecord {
  make: string;
  model: string;
  year: number;
  category: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  [key: string]: unknown;
}

export interface MigrationStats {
  game: string;
  total: number;
  alreadyMigrated: number;
  newlyMigrated: number;
  failed: number;
  failures: Array<{ fallbackId: string; reason: string }>;
}

export interface GameJsonSource {
  gameSlug: string;
  filePath: string;
}

export class CarImageMigrator {
  constructor(
    private readonly downloader: WikiaDownloader,
    private readonly uploader: R2ImageUploader,
  ) {}

  async migrateGame(source: GameJsonSource): Promise<MigrationStats> {
    const stats: MigrationStats = {
      game: source.gameSlug,
      total: 0,
      alreadyMigrated: 0,
      newlyMigrated: 0,
      failed: 0,
      failures: [],
    };

    const raw = await readFile(source.filePath, "utf-8");
    const cars = JSON.parse(raw) as CarRecord[];
    stats.total = cars.length;

    let dirty = false;
    for (let index = 0; index < cars.length; index++) {
      const car = cars[index];
      if (!car) continue;
      if (car.imageKey && car.imageKey.trim() !== "") {
        stats.alreadyMigrated++;
        continue;
      }

      const fallbackId = this.fallbackId(source.gameSlug, index);
      try {
        const downloaded = await this.downloader.download({
          sourceUrl: car.imageUrl ?? null,
          fallbackId,
        });
        const uuid = uuidv4();
        const key = `cars/${source.gameSlug}/${uuid}.${downloaded.extension}`;
        await this.uploader.upload({
          key,
          body: downloaded.body,
          contentType: downloaded.contentType,
        });
        car.imageKey = key;
        dirty = true;
        stats.newlyMigrated++;
        this.logProgress(source.gameSlug, index, cars.length, key);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        stats.failed++;
        stats.failures.push({ fallbackId, reason });
        console.warn(
          `[${source.gameSlug}] FAILED ${car.year} ${car.make} ${car.model} (${fallbackId}): ${reason}`,
        );
      }
    }

    if (dirty) {
      await writeFile(
        source.filePath,
        JSON.stringify(cars, null, 2) + "\n",
        "utf-8",
      );
    }

    return stats;
  }

  private fallbackId(gameSlug: string, index: number): string {
    return `${gameSlug}-${String(index).padStart(4, "0")}`;
  }

  private logProgress(
    gameSlug: string,
    index: number,
    total: number,
    key: string,
  ): void {
    if ((index + 1) % 25 === 0 || index + 1 === total) {
      console.log(`[${gameSlug}] ${index + 1}/${total} uploaded -> ${key}`);
    }
  }
}
