export interface ParsedCar {
  name: string;
  alias?: string;
  year: number;
  pi?: number;
  country?: string;
}

const TEMPLATE_RE =
  /\{\{CarListStatsFM23\|([^}]+)\}\}/g;

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const WIKILINK_PAIR_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

function smartSplit(raw: string): string[] {
  const result: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "[" && raw[i + 1] === "[") {
      bracketDepth++;
      current += "[[";
      i++;
    } else if (raw[i] === "]" && raw[i + 1] === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += "]]";
      i++;
    } else if (raw[i] === "|" && bracketDepth === 0) {
      result.push(current.trim());
      current = "";
    } else {
      current += raw[i];
    }
  }
  result.push(current.trim());
  return result;
}

export function parseFM(wikitext: string): ParsedCar[] {
  const cars: ParsedCar[] = [];

  for (const match of wikitext.matchAll(TEMPLATE_RE)) {
    const params = smartSplit(match[1]);
    if (params.length < 6) continue;

    const yearStr = params[1];
    const rawName = params[2].replace(WIKILINK_RE, "$1").trim();
    const linkMatch = params[2].match(WIKILINK_PAIR_RE);
    const aliasRaw = linkMatch?.[2]?.trim();
    const alias =
      aliasRaw && aliasRaw.length > 0 && aliasRaw !== rawName
        ? aliasRaw
        : undefined;
    const country = params[3];
    const piStr = params[5];

    const year = parseInt(yearStr, 10);
    const pi = parseInt(piStr, 10);

    if (!rawName || isNaN(year)) continue;

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
