interface CarEntry {
  make: string;
  model: string;
  year: number;
}

export interface CarMatch {
  make: string;
  model: string;
  year: number;
}

export interface CarMatchFailure {
  reason: "no_make" | "no_model" | "ambiguous_year";
  makeTried: string | null;
  modelTried: string | null;
  yearHint: number | null;
  candidates?: string[];
}

export type CarMatchResult =
  | { ok: true; match: CarMatch }
  | { ok: false; failure: CarMatchFailure };

/**
 * Maps raw source-sheet car strings ("Honda Civic Type R '97 (RWD, M/C)")
 * to rows in cars.json. Matching is deterministic and diacritic-insensitive.
 */
export class CarMatcher {
  private readonly makesByLength: string[];
  private readonly modelsByMake: Map<string, CarEntry[]>;
  private readonly modelAliases: Map<string, string>;
  private readonly makeAliases: Map<string, string>;

  constructor(cars: CarEntry[]) {
    const makes = new Set<string>();
    this.modelsByMake = new Map();
    for (const car of cars) {
      const makeKey = car.make.toLowerCase();
      makes.add(makeKey);
      const bucket = this.modelsByMake.get(makeKey) ?? [];
      bucket.push(car);
      this.modelsByMake.set(makeKey, bucket);
    }
    this.makesByLength = Array.from(makes).sort(
      (a, b) => b.length - a.length,
    );
    this.modelAliases = CarMatcher.buildModelAliases();
    this.makeAliases = CarMatcher.buildMakeAliases();
  }

  match(rawCar: string): CarMatchResult {
    const cleaned = CarMatcher.stripTrailingParentheticals(rawCar.trim());
    const { base: noYearHint, year: yearHint } = CarMatcher.stripYearHint(cleaned);
    const lower = CarMatcher.foldDiacritics(noYearHint.toLowerCase());

    const make = this.findMake(lower);
    if (!make) {
      return {
        ok: false,
        failure: {
          reason: "no_make",
          makeTried: null,
          modelTried: rawCar,
          yearHint,
        },
      };
    }

    const makeSourceLen = this.matchedMakeLength(lower, make);
    const modelCandidate = noYearHint.slice(makeSourceLen).trim();
    const models = this.modelsByMake.get(make) ?? [];
    const normalizedCandidate = CarMatcher.normalizeModel(modelCandidate);
    const aliasHit = this.modelAliases.get(`${make}|${normalizedCandidate}`);
    const finalCandidate = aliasHit ?? normalizedCandidate;

    const match = CarMatcher.findBestModel(finalCandidate, yearHint, models);
    if (match) return { ok: true, match };

    return {
      ok: false,
      failure: {
        reason: "no_model",
        makeTried: make,
        modelTried: modelCandidate,
        yearHint,
        candidates: models.slice(0, 8).map((m) => `${m.model} (${m.year})`),
      },
    };
  }

  private findMake(lowerName: string): string | null {
    for (const candidate of this.makesByLength) {
      const foldedCandidate = CarMatcher.foldDiacritics(candidate);
      if (lowerName === foldedCandidate) return candidate;
      if (lowerName.startsWith(foldedCandidate + " ")) return candidate;
    }
    for (const [alias, target] of this.makeAliases) {
      if (lowerName === alias) return target;
      if (lowerName.startsWith(alias + " ")) return target;
    }
    return null;
  }

  private matchedMakeLength(lowerName: string, make: string): number {
    const folded = CarMatcher.foldDiacritics(make);
    if (lowerName === folded) return folded.length;
    if (lowerName.startsWith(folded + " ")) return folded.length;
    for (const [alias, target] of this.makeAliases) {
      if (target !== make) continue;
      if (lowerName === alias) return alias.length;
      if (lowerName.startsWith(alias + " ")) return alias.length;
    }
    return make.length;
  }

  private static findBestModel(
    normalizedCandidate: string,
    yearHint: number | null,
    models: CarEntry[],
  ): CarMatch | null {
    if (!normalizedCandidate) return null;

    for (const m of models) {
      const base = CarMatcher.normalizeModel(CarMatcher.stripDbSuffix(m.model));
      if (base !== normalizedCandidate) continue;
      if (yearHint !== null && m.year !== yearHint) continue;
      return { make: m.make, model: m.model, year: m.year };
    }

    const compactCandidate = normalizedCandidate.replace(/\s+/g, "");
    for (const m of models) {
      const compact = CarMatcher.normalizeModel(
        CarMatcher.stripDbSuffix(m.model),
      ).replace(/\s+/g, "");
      if (compact !== compactCandidate) continue;
      if (yearHint !== null && m.year !== yearHint) continue;
      return { make: m.make, model: m.model, year: m.year };
    }

    return null;
  }

  /** Strip trailing disambiguator suffix from DB model: `(2005)`, `(R35)`, `(MK II)`. */
  private static stripDbSuffix(model: string): string {
    return model.replace(/\s*\([^()]*\)\s*$/, "").trim();
  }

  private static normalizeModel(value: string): string {
    return CarMatcher.foldDiacritics(value)
      .toLowerCase()
      .replace(/[-_/]+/g, " ")
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private static foldDiacritics(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  private static stripTrailingParentheticals(value: string): string {
    let result = value;
    while (/\([^()]*\)\s*$/.test(result)) {
      result = result.replace(/\s*\([^()]*\)\s*$/, "").trim();
    }
    return result;
  }

  private static stripYearHint(value: string): {
    base: string;
    year: number | null;
  } {
    const match = value.match(/\s'(\d{2})$/);
    if (!match) return { base: value, year: null };
    const yy = Number(match[1]);
    const year = yy >= 30 ? 1900 + yy : 2000 + yy;
    return { base: value.slice(0, match.index).trim(), year };
  }

  /**
   * Manual aliases for known sheet-vs-DB naming drift.
   * Entry: `[make, normalizedModel from sheet, normalizedModel in DB]`.
   * Normalization here must mirror `normalizeModel`.
   */
  private static buildModelAliases(): Map<string, string> {
    const pairs: Array<[string, string, string]> = [
      ["audi", "avant rs 2", "rs 2 avant"],
      ["toyota", "86", "gt86"],
      ["nissan", "gt r nismo", "gt r nismo"],
      ["austin-healey", "sprite mk1", "sprite mki"],
    ];
    const map = new Map<string, string>();
    for (const [make, sheet, db] of pairs) {
      map.set(`${make}|${sheet}`, db);
    }
    return map;
  }

  /** Map sheet-used makes to DB makes. key = alias (lowercase). */
  private static buildMakeAliases(): Map<string, string> {
    return new Map<string, string>([
      ["austin", "austin-healey"],
    ]);
  }
}
