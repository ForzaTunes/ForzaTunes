import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CarMatcher } from "./CarMatcher";
import { SaeenuHtmlViewParser } from "./SaeenuHtmlViewParser";
import { SaeenuRowNormalizer } from "./SaeenuRowNormalizer";
import { TuneCsvWriter } from "./TuneCsvWriter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const SOURCE_URL =
  "https://docs.google.com/spreadsheets/d/1mIJQIalcnsRUkwReVpmMlcaw17dYZtk-Xejwk_jSFJo/htmlview";

interface SaeenuExtractorOptions {
  inputPath: string;
  outputCsvPath: string;
  skipLogPath: string;
}

class SaeenuExtractor {
  private readonly parser: SaeenuHtmlViewParser;
  private readonly normalizer = new SaeenuRowNormalizer();
  private readonly matcher: CarMatcher;
  private readonly writer = new TuneCsvWriter();
  private readonly skipLog: string[] = [];
  private readonly seenShareCodes = new Set<string>();

  constructor(content: string, cars: Array<{ make: string; model: string; year: number }>) {
    this.parser = new SaeenuHtmlViewParser(content);
    this.matcher = new CarMatcher(cars);
  }

  run(options: SaeenuExtractorOptions): void {
    let parsedCount = 0;
    for (const raw of this.parser.iterRows()) {
      parsedCount++;
      const normResult = this.normalizer.normalize(raw);
      if (!normResult.ok) {
        this.logSkip(raw.lineNumber, normResult.failure.reason, raw.car);
        continue;
      }
      const norm = normResult.row;

      if (this.seenShareCodes.has(norm.shareCode)) {
        this.logSkip(norm.lineNumber, "duplicate share_code", norm.rawCar);
        continue;
      }

      const matchResult = this.matcher.match(norm.rawCar);
      if (!matchResult.ok) {
        this.logSkip(
          norm.lineNumber,
          `car match failed (${matchResult.failure.reason}${matchResult.failure.makeTried ? ", make=" + matchResult.failure.makeTried : ""}${matchResult.failure.modelTried ? ", model=" + matchResult.failure.modelTried : ""})`,
          norm.rawCar,
        );
        continue;
      }
      const car = matchResult.match;

      this.seenShareCodes.add(norm.shareCode);
      this.writer.add({
        game_slug: "fh5",
        share_code: norm.shareCode,
        make: car.make,
        model: car.model,
        year: car.year,
        car_class: norm.carClass,
        pi_rating: norm.piRating,
        tune_type: norm.tuneType,
        drivetrain: norm.drivetrain,
        track: norm.track,
        creator_gamertag: norm.creator,
        title: norm.tuneName,
        description: norm.notes,
        source_url: SOURCE_URL,
      });
    }

    this.writer.writeTo(options.outputCsvPath);
    writeFileSync(
      options.skipLogPath,
      this.skipLog.length === 0
        ? "No skipped rows.\n"
        : this.skipLog.join("\n") + "\n",
      "utf-8",
    );

    const kept = this.writer.size();
    const skipped = this.skipLog.length;
    console.log(
      `Parsed ${parsedCount} candidate rows -> ${kept} matched, ${skipped} skipped`,
    );
    console.log(`CSV:  ${options.outputCsvPath}`);
    console.log(`Log:  ${options.skipLogPath}`);
  }

  private logSkip(lineNumber: number, reason: string, carName: string): void {
    this.skipLog.push(`line ${lineNumber}: ${reason} | car="${carName}"`);
  }
}

function resolveInputPath(): string {
  const argPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (argPath) return argPath;
  console.error(
    "Usage: npx tsx scripts/imports/extract-saeenu-fh5.ts <path-to-htmlview-dump.txt>",
  );
  console.error(
    "Source sheet: https://docs.google.com/spreadsheets/d/1mIJQIalcnsRUkwReVpmMlcaw17dYZtk-Xejwk_jSFJo/htmlview",
  );
  process.exit(1);
}

function main(): void {
  const carsJsonPath = join(repoRoot, "src", "data", "cars", "fh5.json");
  const cars = JSON.parse(readFileSync(carsJsonPath, "utf-8"));

  const inputPath = resolveInputPath();
  if (!existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`);
    process.exit(1);
  }

  const outputCsvPath = join(
    repoRoot,
    "src",
    "data",
    "imports",
    "tunes",
    "saeenu-fh5.csv",
  );
  const skipLogPath = join(
    repoRoot,
    "src",
    "data",
    "imports",
    "tunes",
    "_extract-saeenu-fh5.log",
  );

  const content = readFileSync(inputPath, "utf-8");
  new SaeenuExtractor(content, cars).run({ inputPath, outputCsvPath, skipLogPath });
}

main();
