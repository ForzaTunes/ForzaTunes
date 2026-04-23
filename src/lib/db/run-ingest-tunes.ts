import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../data");
const importsDir = join(dataDir, "imports/tunes");
const unresolvedLog = join(importsDir, "_unresolved.log");

const isRemote = process.argv.includes("--remote");
const flag = isRemote ? "--remote" : "--local";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targetFile = args[0] ?? null;

interface GameEntry {
  slug: string;
  shareCodeLength: number;
  classRanges: Array<{ class: string; min: number; max: number }>;
  tuneTypes: Array<{ value: string }>;
}

interface CarEntry {
  make: string;
  model: string;
  year: number;
}

interface CsvRow {
  game_slug: string;
  share_code: string;
  make: string;
  model: string;
  year: string;
  car_class: string;
  pi_rating: string;
  tune_type: string;
  drivetrain: string;
  track: string;
  creator_gamertag: string;
  title: string;
  description: string;
  source_url: string;
}

const REQUIRED_COLUMNS: (keyof CsvRow)[] = [
  "game_slug",
  "share_code",
  "make",
  "model",
  "year",
  "car_class",
  "pi_rating",
  "tune_type",
  "creator_gamertag",
  "title",
  "source_url",
];

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function parseCsv(content: string): CsvRow[] {
  const lines = splitCsvLines(content);
  if (lines.length === 0) return [];
  const header = parseCsvLine(lines[0]!).map((c) => c.trim());
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i]!;
    if (raw.trim() === "") continue;
    const cols = parseCsvLine(raw);
    const row = {} as Record<string, string>;
    for (let j = 0; j < header.length; j++) {
      row[header[j]!] = (cols[j] ?? "").trim();
    }
    rows.push(row as unknown as CsvRow);
  }
  return rows;
}

function splitCsvLines(content: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i]!;
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && content[i + 1] === "\n") i++;
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0) out.push(current);
  return out;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function validateHeader(rows: CsvRow[], file: string): void {
  if (rows.length === 0) return;
  const sample = rows[0]!;
  const missing = REQUIRED_COLUMNS.filter((c) => !(c in sample));
  if (missing.length > 0) {
    throw new Error(
      `CSV ${file} is missing required columns: ${missing.join(", ")}`,
    );
  }
}

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function deterministicSlug(seed: string, length = 10): string {
  const hash = createHash("sha256").update(seed).digest();
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[hash[i]! % 62];
  }
  return out;
}

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

class CarIndex {
  private readonly byGameAndKey: Map<string, number>;

  constructor(gamesBySlug: Map<string, number>, carsByGame: Map<string, CarEntry[]>) {
    this.byGameAndKey = new Map();
    for (const [slug, cars] of carsByGame.entries()) {
      const gameId = gamesBySlug.get(slug);
      if (!gameId) continue;
      for (const car of cars) {
        const key = CarIndex.key(slug, car.make, car.model, car.year);
        this.byGameAndKey.set(key, gameId);
      }
    }
  }

  static key(gameSlug: string, make: string, model: string, year: number | string): string {
    return `${gameSlug}|${normalizeForMatch(make)}|${normalizeForMatch(model)}|${year}`;
  }

  has(gameSlug: string, make: string, model: string, year: number): boolean {
    return this.byGameAndKey.has(CarIndex.key(gameSlug, make, model, year));
  }
}

function loadCsvFiles(): Array<{ file: string; rows: CsvRow[] }> {
  if (!existsSync(importsDir)) {
    throw new Error(`Imports directory not found: ${importsDir}`);
  }
  const allFiles = readdirSync(importsDir).filter(
    (f) => f.endsWith(".csv") && !f.startsWith("_"),
  );
  const files = targetFile
    ? allFiles.filter((f) => f === targetFile)
    : allFiles;
  if (targetFile && files.length === 0) {
    throw new Error(`Target CSV not found: ${targetFile}`);
  }
  return files.map((f) => {
    const rows = parseCsv(readFileSync(join(importsDir, f), "utf-8"));
    validateHeader(rows, f);
    return { file: f, rows };
  });
}

function loadGamesAndCars() {
  const games: GameEntry[] = JSON.parse(
    readFileSync(join(dataDir, "games.json"), "utf-8"),
  );
  const gamesBySlug = new Map<string, number>();
  const gamesMeta = new Map<string, GameEntry>();
  for (let i = 0; i < games.length; i++) {
    const game = games[i]!;
    gamesBySlug.set(game.slug, i + 1);
    gamesMeta.set(game.slug, game);
  }

  const carsByGame = new Map<string, CarEntry[]>();
  for (const game of games) {
    const carsPath = join(dataDir, "cars", `${game.slug}.json`);
    if (!existsSync(carsPath)) continue;
    const cars = JSON.parse(readFileSync(carsPath, "utf-8")) as CarEntry[];
    carsByGame.set(game.slug, cars);
  }
  return { games, gamesBySlug, gamesMeta, carsByGame };
}

function validateRow(
  row: CsvRow,
  gamesMeta: Map<string, GameEntry>,
): string | null {
  if (!row.game_slug || !gamesMeta.has(row.game_slug)) {
    return `unknown game_slug: ${row.game_slug}`;
  }
  const game = gamesMeta.get(row.game_slug)!;
  if (!row.share_code || row.share_code.replace(/\s/g, "").length !== game.shareCodeLength) {
    return `share_code wrong length (expected ${game.shareCodeLength})`;
  }
  const year = Number(row.year);
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    return `invalid year: ${row.year}`;
  }
  const pi = Number(row.pi_rating);
  if (!Number.isFinite(pi) || pi < 100 || pi > 999) {
    return `invalid pi_rating: ${row.pi_rating}`;
  }
  const validClasses = new Set(game.classRanges.map((c) => c.class));
  if (!validClasses.has(row.car_class)) {
    return `unknown car_class ${row.car_class} for ${row.game_slug}`;
  }
  const validTypes = new Set(game.tuneTypes.map((t) => t.value));
  if (!validTypes.has(row.tune_type)) {
    return `unknown tune_type ${row.tune_type} for ${row.game_slug}`;
  }
  if (row.drivetrain && !["AWD", "RWD", "FWD"].includes(row.drivetrain)) {
    return `invalid drivetrain: ${row.drivetrain}`;
  }
  if (!row.creator_gamertag.trim()) return "missing creator_gamertag";
  if (!row.title.trim()) return "missing title";
  if (!row.source_url.trim()) return "missing source_url";
  return null;
}

class IngestBuilder {
  readonly statements: string[] = [];
  private readonly seenGamertags = new Set<string>();

  addStubUser(creatorGamertag: string): void {
    const key = creatorGamertag.toLowerCase();
    if (this.seenGamertags.has(key)) return;
    this.seenGamertags.add(key);
    const slug = deterministicSlug(`gamertag:${key}`);
    const username = escapeSql(creatorGamertag);
    const gamertag = escapeSql(creatorGamertag);
    this.statements.push(
      `INSERT OR IGNORE INTO users (username, forza_gamertag, public_slug) VALUES ('${username}', '${gamertag}', '${slug}');`,
    );
  }

  addTune(row: CsvRow, gameSlug: string, importedAt: string): void {
    const gameSelect = `(SELECT id FROM games WHERE slug = '${escapeSql(gameSlug)}')`;
    const carSelect = `(SELECT id FROM cars WHERE game_id = ${gameSelect} AND LOWER(make) = LOWER('${escapeSql(row.make)}') AND LOWER(model) = LOWER('${escapeSql(row.model)}') AND year = ${Number(row.year)})`;
    const userSelect = `(SELECT id FROM users WHERE LOWER(forza_gamertag) = LOWER('${escapeSql(row.creator_gamertag)}'))`;

    const shareCode = row.share_code.replace(/\s/g, "");
    const title = escapeSql(row.title);
    const description = row.description
      ? `'${escapeSql(row.description)}'`
      : "NULL";
    const creatorGamertag = escapeSql(row.creator_gamertag);
    const drivetrain = row.drivetrain ? `'${escapeSql(row.drivetrain)}'` : "NULL";
    const trackName = row.track ? `'${escapeSql(row.track)}'` : "NULL";
    const sourceUrl = `'${escapeSql(row.source_url)}'`;
    const importedAtSql = `'${escapeSql(importedAt)}'`;

    this.statements.push(
      `INSERT OR IGNORE INTO tunes
  (game_id, share_code, car_id, title, description, creator_gamertag,
   tune_type, pi_rating, car_class, drivetrain, track_name, user_id,
   source_url, imported_at)
 VALUES (
   ${gameSelect}, '${escapeSql(shareCode)}', ${carSelect}, '${title}', ${description}, '${creatorGamertag}',
   '${escapeSql(row.tune_type)}', ${Number(row.pi_rating)}, '${escapeSql(row.car_class)}', ${drivetrain}, ${trackName}, ${userSelect},
   ${sourceUrl}, ${importedAtSql}
 );`,
    );
  }
}

function run(): void {
  const { gamesBySlug, gamesMeta, carsByGame } = loadGamesAndCars();
  const carIndex = new CarIndex(gamesBySlug, carsByGame);

  const csvFiles = loadCsvFiles();
  if (csvFiles.length === 0) {
    console.log("No CSV files to ingest.");
    return;
  }

  const importedAt = new Date().toISOString();
  const builder = new IngestBuilder();

  let totalRows = 0;
  let resolvedRows = 0;
  let unresolvedRows = 0;

  if (existsSync(unresolvedLog)) unlinkSync(unresolvedLog);

  for (const { file, rows } of csvFiles) {
    console.log(`\n${file}: ${rows.length} rows`);
    for (let i = 0; i < rows.length; i++) {
      totalRows++;
      const row = rows[i]!;
      const rowRef = `${file}:${i + 2}`;

      const validationError = validateRow(row, gamesMeta);
      if (validationError) {
        unresolvedRows++;
        appendFileSync(
          unresolvedLog,
          `${rowRef}\t${row.creator_gamertag}\t${row.make} ${row.model} ${row.year}\t${validationError}\n`,
        );
        continue;
      }

      const year = Number(row.year);
      if (!carIndex.has(row.game_slug, row.make, row.model, year)) {
        unresolvedRows++;
        appendFileSync(
          unresolvedLog,
          `${rowRef}\t${row.creator_gamertag}\t${row.make} ${row.model} ${year}\tcar not in cars.json for ${row.game_slug}\n`,
        );
        continue;
      }

      builder.addStubUser(row.creator_gamertag);
      builder.addTune(row, row.game_slug, importedAt);
      resolvedRows++;
    }
  }

  console.log(
    `\nTotal: ${totalRows}, resolved: ${resolvedRows}, unresolved: ${unresolvedRows}`,
  );
  if (unresolvedRows > 0) {
    console.log(`Unresolved rows written to ${basename(unresolvedLog)}`);
  }
  if (resolvedRows === 0) {
    console.log("No rows to ingest. Fix unresolved.log and re-run.");
    return;
  }

  const tempFile = join(__dirname, "_ingest.sql");
  writeFileSync(tempFile, builder.statements.join("\n"), "utf-8");

  console.log(`\nIngesting ${flag}: ${resolvedRows} tune rows`);
  try {
    execSync(
      `npx wrangler d1 execute forzatunes-db ${flag} --file="${tempFile}"`,
      { stdio: "inherit" },
    );
    console.log("\nIngest complete!");
  } finally {
    unlinkSync(tempFile);
  }
}

run();
