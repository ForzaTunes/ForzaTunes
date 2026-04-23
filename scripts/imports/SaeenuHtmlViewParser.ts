export interface RawTableRow {
  event: string;
  classRestrictions: string;
  car: string;
  creator: string;
  raceType: string;
  tuneName: string;
  shareCode: string;
  notes: string;
  lineNumber: number;
}

type ColumnIndex = {
  event: number | null;
  classRestrictions: number | null;
  car: number;
  creator: number | null;
  raceType: number | null;
  tuneName: number | null;
  shareCode: number;
  notes: number | null;
};

/**
 * Parses the `/htmlview` dump of Saeenu's FH5 sheet into raw rows.
 *
 * The sheet has several tabs rendered sequentially, each with its own header
 * row. This parser detects headers, remembers each column's index, and emits
 * rows that carry a valid share code.
 */
export class SaeenuHtmlViewParser {
  private readonly lines: string[];
  private current: ColumnIndex | null = null;

  constructor(content: string) {
    this.lines = content.split(/\r?\n/);
  }

  *iterRows(): Generator<RawTableRow> {
    for (let i = 0; i < this.lines.length; i++) {
      const raw = this.lines[i]!;
      if (!raw.startsWith("|")) continue;

      const cells = SaeenuHtmlViewParser.splitCells(raw);
      if (cells.length < 3) continue;

      const maybeHeader = SaeenuHtmlViewParser.tryParseHeader(cells);
      if (maybeHeader) {
        this.current = maybeHeader;
        continue;
      }

      const schema = this.current;
      if (!schema) continue;

      const shareCode = cells[schema.shareCode] ?? "";
      if (!SaeenuHtmlViewParser.looksLikeShareCode(shareCode)) continue;

      yield {
        event: schema.event !== null ? (cells[schema.event] ?? "") : "",
        classRestrictions:
          schema.classRestrictions !== null
            ? (cells[schema.classRestrictions] ?? "")
            : "",
        car: cells[schema.car] ?? "",
        creator: schema.creator !== null ? (cells[schema.creator] ?? "") : "",
        raceType: schema.raceType !== null ? (cells[schema.raceType] ?? "") : "",
        tuneName: schema.tuneName !== null ? (cells[schema.tuneName] ?? "") : "",
        shareCode,
        notes: schema.notes !== null ? (cells[schema.notes] ?? "") : "",
        lineNumber: i + 1,
      };
    }
  }

  private static splitCells(line: string): string[] {
    const trimmed = line.endsWith("|") ? line.slice(0, -1) : line;
    return trimmed
      .split("|")
      .map((c) => SaeenuHtmlViewParser.stripLinks(c).trim());
  }

  private static stripLinks(value: string): string {
    return value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  }

  private static looksLikeShareCode(value: string): boolean {
    const digits = value.replace(/\s/g, "");
    return /^\d{9}$/.test(digits);
  }

  private static tryParseHeader(cells: string[]): ColumnIndex | null {
    const upper = cells.map((c) => c.toUpperCase());
    const shareCodeIdx = upper.findIndex((v) => v === "SHARE CODE");
    const carIdx = upper.findIndex((v) => v === "CAR");
    if (shareCodeIdx === -1 || carIdx === -1) return null;

    const find = (candidates: string[]): number | null => {
      for (const candidate of candidates) {
        const idx = upper.findIndex((v) => v === candidate);
        if (idx !== -1) return idx;
      }
      return null;
    };

    return {
      event: find([
        "SEASONAL EVENT (MAINLAND, MEXICO)",
        "SEASONAL EVENT (RALLY ADVENTURE)",
        "SEASONAL EVENT (HOT WHEELS)",
        "TREASURE HUNT (CLUE)",
        "FORZATHON DAILY CHALLENGE",
        "NEW REWARD CARS",
        "EVENT",
      ]),
      classRestrictions: find(["CLASS & RESTRICTIONS", "CLASS"]),
      car: carIdx,
      creator: find(["CREATOR", "TUNER"]),
      raceType: find(["RACE TYPE"]),
      tuneName: find(["TUNE NAME"]),
      shareCode: shareCodeIdx,
      notes: find(["NOTES"]),
    };
  }
}
