import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../data");
const isRemote = process.argv.includes("--remote");
const flag = isRemote ? "--remote" : "--local";

interface GameEntry {
  slug: string;
  name: string;
  shareCodeLength: number;
}

interface CarEntry {
  make: string;
  model: string;
  year: number;
  category: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

const games: GameEntry[] = JSON.parse(
  readFileSync(join(dataDir, "games.json"), "utf-8"),
);

const statements: string[] = [];

for (const game of games) {
  statements.push(
    `INSERT INTO games (name, slug, share_code_length) VALUES ('${escapeSql(game.name)}', '${escapeSql(game.slug)}', ${game.shareCodeLength}) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, share_code_length = excluded.share_code_length;`,
  );
}

let totalCars = 0;

for (const game of games) {
  const carsPath = join(dataDir, "cars", `${game.slug}.json`);
  const cars: CarEntry[] = JSON.parse(readFileSync(carsPath, "utf-8"));

  for (const car of cars) {
    const category = car.category ? `'${escapeSql(car.category)}'` : "NULL";
    const imageUrl = car.imageUrl ? `'${escapeSql(car.imageUrl)}'` : "NULL";
    const imageKey = car.imageKey ? `'${escapeSql(car.imageKey)}'` : "NULL";
    const gameSelect = `(SELECT id FROM games WHERE slug = '${escapeSql(game.slug)}')`;
    const make = `'${escapeSql(car.make)}'`;
    const model = `'${escapeSql(car.model)}'`;

    statements.push(
      `INSERT OR IGNORE INTO cars (game_id, make, model, year, category, image_url, image_key) VALUES (${gameSelect}, ${make}, ${model}, ${car.year}, ${category}, ${imageUrl}, ${imageKey});`,
    );
    statements.push(
      `UPDATE cars SET image_url = ${imageUrl}, image_key = ${imageKey}, category = ${category} WHERE game_id = ${gameSelect} AND make = ${make} AND model = ${model} AND year = ${car.year};`,
    );
  }

  console.log(`  ${game.slug}: ${cars.length} cars`);
  totalCars += cars.length;
}

console.log(`\nSeeding ${flag}: ${games.length} games, ${totalCars} cars`);

const tempFile = join(__dirname, "_seed.sql");
writeFileSync(tempFile, statements.join("\n"), "utf-8");

try {
  execSync(`npx wrangler d1 execute forzatunes-db ${flag} --file="${tempFile}"`, {
    stdio: "inherit",
  });
  console.log("\nSeed complete!");
} finally {
  unlinkSync(tempFile);
}
