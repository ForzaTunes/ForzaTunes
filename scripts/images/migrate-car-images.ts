import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CarImageMigrator, type MigrationStats } from "./CarImageMigrator";
import { R2ImageUploader } from "./R2ImageUploader";
import { WikiaDownloader } from "./WikiaDownloader";

function loadEnvFile(path: string): void {
  try {
    const content = readFileSync(path, "utf-8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // no .env is fine; fall back to real env
  }
}

function printSummary(results: MigrationStats[]): void {
  console.log("\n===== Migration summary =====");
  for (const r of results) {
    console.log(
      `${r.game}: total=${r.total} migrated=${r.newlyMigrated} already=${r.alreadyMigrated} failed=${r.failed}`,
    );
    if (r.failures.length > 0) {
      console.log("  Failures (drop files matching fallbackId into scripts/images/fallbacks/):");
      for (const f of r.failures) {
        console.log(`    ${f.fallbackId}: ${f.reason}`);
      }
    }
  }
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  if (totalFailed > 0) {
    console.log(
      `\n${totalFailed} failures remain. Add replacement files to scripts/images/fallbacks/ and re-run.`,
    );
  } else {
    console.log("\nAll car images migrated successfully.");
  }
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(scriptDir, "..", "..");

  loadEnvFile(join(repoRoot, ".env"));

  const carsDir = join(repoRoot, "src", "data", "cars");
  const fallbackDir = join(scriptDir, "fallbacks");

  const games = [
    { gameSlug: "fh5", filePath: join(carsDir, "fh5.json") },
    { gameSlug: "fm", filePath: join(carsDir, "fm.json") },
    { gameSlug: "fh6", filePath: join(carsDir, "fh6.json") },
  ];

  const downloader = new WikiaDownloader(fallbackDir);
  const uploader = R2ImageUploader.fromEnv(process.env);
  const migrator = new CarImageMigrator(downloader, uploader);

  const results: MigrationStats[] = [];
  for (const game of games) {
    console.log(`\n--- Migrating ${game.gameSlug} ---`);
    const stats = await migrator.migrateGame(game);
    results.push(stats);
  }

  printSummary(results);

  const anyFailed = results.some((r) => r.failed > 0);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
