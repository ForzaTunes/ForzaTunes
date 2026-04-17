export interface ParsedCar {
  name: string;
  alias?: string;
  year: number;
  pi?: number;
  country?: string;
}

const TEMPLATE_RE =
  /\{\{CarListStatsFH5\|([^}]+)\}\}/g;

export function parseFH5(wikitext: string): ParsedCar[] {
  const cars: ParsedCar[] = [];

  for (const match of wikitext.matchAll(TEMPLATE_RE)) {
    const params = match[1].split("|").map((p) => p.trim());
    if (params.length < 14) continue;

    const rawName = params[0].replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
    const rawAlias = params[1];
    const yearStr = params[2];
    const piStr = params[12];
    const country = params[13];

    const year = parseInt(yearStr, 10);
    const pi = parseInt(piStr, 10);

    if (!rawName || isNaN(year)) continue;

    const alias = rawAlias && rawAlias.length > 0 ? rawAlias : undefined;

    cars.push({
      name: rawName,
      alias,
      year,
      pi: isNaN(pi) ? undefined : pi,
      country: country || undefined,
    });
  }

  return cars;
}
