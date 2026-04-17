export interface ParsedCar {
  name: string;
  alias?: string;
  year: number;
  carClass?: string;
}

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

export function parseFH6(wikitext: string): ParsedCar[] {
  const cars: ParsedCar[] = [];
  const lines = wikitext.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === "|-") {
      const cells: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith("|") && !lines[i].trim().startsWith("|-") && !lines[i].trim().startsWith("|}")) {
        cells.push(lines[i].trim().replace(/^\|/, "").trim());
        i++;
      }

      if (cells.length >= 2) {
        const yearStr = cells[0];
        const nameCell = cells[1];
        const carClass = cells[2] || undefined;

        const year = parseInt(yearStr, 10);
        const linkMatch = nameCell.match(WIKILINK_RE);
        const rawName = linkMatch ? linkMatch[1].trim() : nameCell.trim();
        const aliasRaw = linkMatch?.[2]?.trim();
        const alias =
          aliasRaw && aliasRaw.length > 0 && aliasRaw !== rawName
            ? aliasRaw
            : undefined;

        if (rawName && !isNaN(year)) {
          cars.push({
            name: rawName,
            alias,
            year,
            carClass: carClass || undefined,
          });
        }
      }
      continue;
    }

    i++;
  }

  return cars;
}
