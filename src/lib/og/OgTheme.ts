export const OG_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

export interface OgGameTheme {
  accent300: string;
  accent500: string;
  accent600: string;
  accent900: string;
}

const DEFAULT_THEME: OgGameTheme = {
  accent300: "#f07fb2",
  accent500: "#d42d76",
  accent600: "#b82568",
  accent900: "#581236",
};

const GAME_THEMES: Record<string, OgGameTheme> = {
  fh5: {
    accent300: "#fdba74",
    accent500: "#f97316",
    accent600: "#ea580c",
    accent900: "#7c2d12",
  },
  fm: {
    accent300: "#fca5a5",
    accent500: "#ef4444",
    accent600: "#dc2626",
    accent900: "#7f1d1d",
  },
  fh6: {
    accent300: "#f9a8d4",
    accent500: "#ec4899",
    accent600: "#db2777",
    accent900: "#831843",
  },
};

// Mirrors --fz-class-* CSS variables in src/styles/global.css.
const CLASS_COLORS: Record<string, Record<string, string>> = {
  fh5: {
    D: "#61a9c8",
    C: "#cc9813",
    B: "#cc5519",
    A: "#ea3358",
    S1: "#a24ec0",
    S2: "#3f59ae",
    X: "#30a32a",
  },
  fm: {
    E: "#ea3358",
    D: "#61a9c8",
    C: "#cc9813",
    B: "#cc5519",
    A: "#c94a1a",
    S: "#a24ec0",
    R: "#3f59ae",
    P: "#30a32a",
    X: "#7a9e5b",
  },
  fh6: {
    D: "#8a8f98",
    C: "#61a9c8",
    B: "#cc9813",
    A: "#cc5519",
    S1: "#ea3358",
    S2: "#a24ec0",
    R: "#30a32a",
    X: "#3f59ae",
  },
};

export const OG_PALETTE = {
  // Matches the site's TuneCard background (bg-gray-900).
  background: "#111827",
  // A touch darker, for layered elements that sit on the background.
  backgroundDeep: "#0a0a0a",
  surface: "#030712",
  surfaceElevated: "#1f2937",
  text: "#f3f4f6",
  textSubtle: "#d1d5db",
  muted: "#9ca3af",
  // Inset card outline. Matches border-gray-700 on site cards.
  cardBorder: "#374151",
  border: "#374151",
  star: "#fbbf24",
} as const;

export class OgTheme {
  static forGame(gameSlug: string | null | undefined): OgGameTheme {
    if (!gameSlug) return DEFAULT_THEME;
    return GAME_THEMES[gameSlug] ?? DEFAULT_THEME;
  }

  static classColor(
    gameSlug: string | null | undefined,
    carClass: string,
  ): string {
    const table = gameSlug ? CLASS_COLORS[gameSlug] : undefined;
    return table?.[carClass] ?? OG_PALETTE.surfaceElevated;
  }

  static readonly FONT_FAMILY = "Exo 2";
  static readonly SITE_NAME = "ForzaTunes";
  static readonly LOGO_ACCENT = "#e83382";
  static readonly LOGO_BG = "#030712";
}
