const BASE_URL = "https://forza.fandom.com/api.php";
const USER_AGENT = "ForzaTunesScraper/1.0 (community car list tool)";
const RATE_LIMIT_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch(params: Record<string, string>): Promise<unknown> {
  const url = new URL(BASE_URL);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Wiki API ${response.status}: ${response.statusText}`);
  }

  await sleep(RATE_LIMIT_MS);
  return response.json();
}

export async function fetchWikitext(
  page: string,
  section?: number,
): Promise<string> {
  const params: Record<string, string> = {
    action: "parse",
    page,
    prop: "wikitext",
  };
  if (section !== undefined) {
    params.section = String(section);
  }

  const data = (await apiFetch(params)) as {
    parse?: { wikitext?: { "*"?: string } };
  };

  const wikitext = data?.parse?.wikitext?.["*"];
  if (!wikitext) {
    throw new Error(`No wikitext returned for page: ${page}`);
  }
  return wikitext;
}

export interface WikiImage {
  name: string;
  url: string;
}

export async function fetchAllImages(prefix: string): Promise<WikiImage[]> {
  const results: WikiImage[] = [];
  let aicontinue: string | undefined;

  for (;;) {
    const params: Record<string, string> = {
      action: "query",
      list: "allimages",
      aiprefix: `${prefix}_`,
      aiprop: "url",
      ailimit: "500",
    };
    if (aicontinue) params.aicontinue = aicontinue;

    const data = (await apiFetch(params)) as {
      query?: { allimages?: Array<{ name?: string; url?: string }> };
      continue?: { aicontinue?: string };
    };

    const batch = data.query?.allimages ?? [];
    for (const img of batch) {
      if (img.name && img.url) {
        results.push({ name: img.name, url: img.url });
      }
    }

    const next = data.continue?.aicontinue;
    if (!next) break;
    aicontinue = next;
  }

  return results;
}
