import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchWikitext, fetchAllImages } from "./wiki-api.js";
import { WikiImageIndex } from "./image-index.js";
import { parseFH5 } from "./parsers/parseFH5.js";
import { parseFM } from "./parsers/parseFM.js";
import { parseFH6 } from "./parsers/parseFH6.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const carsDir = join(__dirname, "../src/data/cars");

const makes: string[] = JSON.parse(
  readFileSync(join(__dirname, "makes.json"), "utf-8"),
);
const makesSorted = [...makes].sort((a, b) => b.length - a.length);

interface CarEntry {
  make: string;
  model: string;
  year: number;
  category: string | null;
  imageUrl?: string | null;
}

interface ParsedCarLike {
  name: string;
  alias?: string;
  year: number;
}

interface GameConfig {
  slug: string;
  wikiPage: string;
  wikiSection?: number;
  imagePrefix: string;
  parse: (wikitext: string) => ParsedCarLike[];
}

const GAMES: GameConfig[] = [
  {
    slug: "fh5",
    wikiPage: "Forza_Horizon_5/Cars",
    imagePrefix: "FH5",
    parse: parseFH5,
  },
  {
    slug: "fm",
    wikiPage: "Forza_Motorsport_(2023)/Cars",
    wikiSection: 1,
    imagePrefix: "FM23",
    parse: parseFM,
  },
  {
    slug: "fh6",
    wikiPage: "Forza_Horizon_6/Cars",
    wikiSection: 1,
    imagePrefix: "FH6",
    parse: parseFH6,
  },
];

const DISPLAY_NAME_ALIASES: Record<string, string> = {
  "Fast and Furious ": "Fast & Furious ",
};

function normalizeDisplay(name: string): string {
  for (const [from, to] of Object.entries(DISPLAY_NAME_ALIASES)) {
    if (name.startsWith(from)) return to + name.slice(from.length);
  }
  return name;
}

function splitMakeModel(name: string): { make: string; model: string } {
  for (const make of makesSorted) {
    if (name.startsWith(make + " ")) {
      return { make, model: name.slice(make.length + 1) };
    }
    if (name === make) {
      return { make, model: "" };
    }
    if (name.toLowerCase().startsWith(make.toLowerCase() + " ")) {
      return { make, model: name.slice(make.length + 1) };
    }
  }
  const spaceIdx = name.indexOf(" ");
  if (spaceIdx > 0) {
    return { make: name.slice(0, spaceIdx), model: name.slice(spaceIdx + 1) };
  }
  return { make: name, model: "" };
}

function buildImageCandidates(car: ParsedCarLike): string[] {
  const candidates: string[] = [];
  const push = (value: string | undefined): void => {
    if (value && value.trim().length > 0) candidates.push(value);
  };

  const year = String(car.year);

  if (car.alias) {
    push(`${car.alias} ${year}`);
    push(car.alias);
  }

  const display = car.name;
  const parenYearReplaced = display.replace(/\((\d{4})\)/, "$1");
  push(parenYearReplaced);

  const parenContentKept = display.replace(/\(([^)]+)\)/g, "$1");
  push(parenContentKept);

  const parenStripped = display.replace(/\s*\([^)]*\)/g, "").trim();
  push(parenStripped);

  push(display);
  push(`${display} ${year}`);
  push(`${parenStripped} ${year}`);

  return Array.from(new Set(candidates));
}

function loadExisting(slug: string): CarEntry[] {
  try {
    return JSON.parse(readFileSync(join(carsDir, `${slug}.json`), "utf-8"));
  } catch {
    return [];
  }
}

function migrateExistingSplits(existing: CarEntry[]): CarEntry[] {
  return existing.map((c) => {
    const joined = c.model ? `${c.make} ${c.model}` : c.make;
    const normalized = normalizeDisplay(joined);
    const { make, model } = splitMakeModel(normalized);
    return { ...c, make, model };
  });
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[-'']/g, " ").replace(/\s+/g, " ").trim();
}

function mergeOne(prev: CarEntry, incoming: CarEntry): CarEntry {
  return {
    ...prev,
    imageUrl: prev.imageUrl ?? incoming.imageUrl ?? null,
    category: prev.category ?? incoming.category ?? null,
  };
}

// Image + category merge contract (manual override UX):
// - If an entry already has a non-null imageUrl/category, the scraper never overwrites it.
// - To pin an image the scraper can't resolve, edit src/data/cars/<slug>.json directly.
// - Re-scrapes only fill in empty fields or add newly-seen cars.
function mergeEntries(
  existing: CarEntry[],
  scraped: CarEntry[],
): CarEntry[] {
  const keyOf = (c: CarEntry) =>
    `${normalizeKey(c.make)}|${normalizeKey(c.model)}|${c.year}`;

  const existingMap = new Map<string, CarEntry>();
  for (const car of existing) {
    const key = keyOf(car);
    const prev = existingMap.get(key);
    existingMap.set(key, prev ? mergeOne(prev, car) : car);
  }

  for (const car of scraped) {
    const key = keyOf(car);
    const prev = existingMap.get(key);
    existingMap.set(key, prev ? mergeOne(prev, car) : car);
  }

  return [...existingMap.values()].sort((a, b) =>
    a.make.localeCompare(b.make) || a.model.localeCompare(b.model),
  );
}

async function scrapeGame(config: GameConfig): Promise<void> {
  console.log(`\n--- ${config.slug.toUpperCase()} ---`);
  console.log(`Fetching wikitext: ${config.wikiPage}...`);

  const wikitext = await fetchWikitext(config.wikiPage, config.wikiSection);
  const parsed = config.parse(wikitext);
  console.log(`Parsed ${parsed.length} cars from wiki`);

  if (parsed.length === 0) {
    console.log("No cars found, skipping");
    return;
  }

  console.log(`Fetching image catalog: ${config.imagePrefix}_* ...`);
  const images = await fetchAllImages(config.imagePrefix);
  const index = new WikiImageIndex(config.imagePrefix, images);
  console.log(`Catalog has ${images.length} images, indexed ${index.size} unique bases`);

  const scrapedCars: CarEntry[] = [];
  let resolved = 0;

  for (const car of parsed) {
    const displayName = normalizeDisplay(car.name);
    const { make, model } = splitMakeModel(displayName);
    const candidates = buildImageCandidates(car);
    const imageUrl = index.lookup(candidates);
    if (imageUrl) resolved++;
    scrapedCars.push({
      make,
      model,
      year: car.year,
      category: null,
      imageUrl: imageUrl ?? null,
    });
  }

  console.log(`Resolved ${resolved} / ${scrapedCars.length} image URLs`);

  const existing = migrateExistingSplits(loadExisting(config.slug));
  const merged = mergeEntries(existing, scrapedCars);

  const outPath = join(carsDir, `${config.slug}.json`);
  writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  console.log(
    `Wrote ${merged.length} cars to ${config.slug}.json (${existing.length} existing, ${scrapedCars.length} scraped)`,
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const gameFlag = args.indexOf("--game");
  const isAll = args.includes("--all");

  let targets: GameConfig[];

  if (isAll) {
    targets = GAMES;
  } else if (gameFlag !== -1 && args[gameFlag + 1]) {
    const slug = args[gameFlag + 1];
    const config = GAMES.find((g) => g.slug === slug);
    if (!config) {
      console.error(`Unknown game: ${slug}. Options: ${GAMES.map((g) => g.slug).join(", ")}`);
      process.exit(1);
    }
    targets = [config];
  } else {
    console.error("Usage: scrape-cars.ts --all | --game <fh5|fm|fh6>");
    process.exit(1);
  }

  for (const config of targets) {
    await scrapeGame(config);
  }

  console.log("\nDone! Run `npm run db:seed:local` to load into D1.");
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
