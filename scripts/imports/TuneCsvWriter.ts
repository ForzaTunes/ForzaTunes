import { writeFileSync } from "node:fs";

export interface TuneCsvRow {
  game_slug: string;
  share_code: string;
  make: string;
  model: string;
  year: number | string;
  car_class: string;
  pi_rating: number | string;
  tune_type: string;
  drivetrain: string;
  track: string;
  creator_gamertag: string;
  title: string;
  description: string;
  source_url: string;
}

const COLUMNS: (keyof TuneCsvRow)[] = [
  "game_slug",
  "share_code",
  "make",
  "model",
  "year",
  "car_class",
  "pi_rating",
  "tune_type",
  "drivetrain",
  "track",
  "creator_gamertag",
  "title",
  "description",
  "source_url",
];

export class TuneCsvWriter {
  private readonly rows: TuneCsvRow[] = [];

  add(row: TuneCsvRow): void {
    this.rows.push(row);
  }

  size(): number {
    return this.rows.length;
  }

  writeTo(path: string): void {
    const lines = [COLUMNS.join(",")];
    for (const row of this.rows) {
      lines.push(COLUMNS.map((c) => this.escape(String(row[c] ?? ""))).join(","));
    }
    writeFileSync(path, lines.join("\n") + "\n", "utf-8");
  }

  private escape(value: string): string {
    const needsQuote = /[",\n\r]/.test(value);
    if (!needsQuote) return value;
    return `"${value.replace(/"/g, '""')}"`;
  }
}
