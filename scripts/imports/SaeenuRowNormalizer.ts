import type { RawTableRow } from "./SaeenuHtmlViewParser";

export interface NormalizedRow {
  shareCode: string;
  carClass: string;
  piRating: number;
  rawCar: string;
  creator: string;
  tuneType: string;
  drivetrain: "AWD" | "RWD" | "FWD" | "";
  tuneName: string;
  notes: string;
  track: string;
  lineNumber: number;
}

export interface NormalizeFailure {
  reason: string;
  row: RawTableRow;
}

export type NormalizeResult =
  | { ok: true; row: NormalizedRow }
  | { ok: false; failure: NormalizeFailure };

const CLASS_RE = /\b(D|C|B|A|S1|S2|X)\s+(\d{3})\b/i;

const RACE_TYPE_MAP: Record<string, string> = {
  road: "road",
  dirt: "dirt",
  "drift (road)": "drift",
  "drift (dirt)": "drift",
  drift: "drift",
  "cross country": "cross_country",
  "cross country / dirt": "cross_country",
  "cross country / road": "cross_country",
  street: "street",
  drag: "drag",
};

export class SaeenuRowNormalizer {
  private readonly defaultCreator: string;

  constructor(options: { defaultCreator?: string } = {}) {
    this.defaultCreator = options.defaultCreator ?? "Saeenu";
  }

  normalize(row: RawTableRow): NormalizeResult {
    const shareCode = row.shareCode.replace(/\s/g, "");
    if (!/^\d{9}$/.test(shareCode)) {
      return this.fail(row, `invalid share_code: ${row.shareCode}`);
    }

    const classMatch =
      row.classRestrictions.match(CLASS_RE) ?? row.car.match(CLASS_RE);
    if (!classMatch) {
      return this.fail(
        row,
        `unparseable class_restrictions: ${row.classRestrictions || row.car}`,
      );
    }
    const carClass = classMatch[1]!.toUpperCase();
    const piRating = Number(classMatch[2]);

    if (!row.car.trim()) return this.fail(row, "missing car");
    const creator = row.creator.trim() || this.defaultCreator;
    if (!creator) return this.fail(row, "missing creator");

    const tuneType = this.mapTuneType(row.raceType);
    if (!tuneType) {
      return this.fail(row, `unknown race_type: ${row.raceType}`);
    }

    const drivetrain = this.extractDrivetrain(row.notes, row.car);
    const title = row.tuneName.trim() || `${carClass} ${tuneType}`;
    const track = this.cleanEvent(row.event);

    return {
      ok: true,
      row: {
        shareCode,
        carClass,
        piRating,
        rawCar: row.car.trim(),
        creator,
        tuneType,
        drivetrain,
        tuneName: title,
        notes: this.cleanNotes(row.notes),
        track,
        lineNumber: row.lineNumber,
      },
    };
  }

  private mapTuneType(raceType: string): string | null {
    const key = raceType.trim().toLowerCase();
    return RACE_TYPE_MAP[key] ?? null;
  }

  private extractDrivetrain(
    notes: string,
    car: string,
  ): "AWD" | "RWD" | "FWD" | "" {
    const combined = `${notes} ${car}`.toUpperCase();
    const first = notes.trim().toUpperCase().split(/[\s,]/)[0] ?? "";
    if (first === "AWD" || first === "RWD" || first === "FWD") return first;
    if (/\bRWD\b/.test(combined)) return "RWD";
    if (/\bAWD\b/.test(combined)) return "AWD";
    if (/\bFWD\b/.test(combined)) return "FWD";
    return "";
  }

  private cleanNotes(notes: string): string {
    return notes
      .replace(/\\~/g, "~")
      .replace(/&&/g, "&")
      .replace(/\s+/g, " ")
      .replace(/\s*\|\s*/g, ", ")
      .trim();
  }

  private cleanEvent(event: string): string {
    if (!event) return "";
    if (event.startsWith("(Tip:") || event.startsWith("(Video")) return "";
    return event.replace(/\s+/g, " ").trim();
  }

  private fail(row: RawTableRow, reason: string): NormalizeResult {
    return { ok: false, failure: { reason, row } };
  }
}
