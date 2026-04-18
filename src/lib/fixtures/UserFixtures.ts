import type { UserRow } from "../managers/interfaces";

const BASE_CREATED = new Date("2026-04-15T12:00:00Z").getTime();

interface FixtureUserSpec {
  username: string;
  gamertag: string;
}

const SPECS: FixtureUserSpec[] = [
  { username: "ApexHunter", gamertag: "ApexHunter_GT" },
  { username: "NitroPilot", gamertag: "NitroPilot" },
  { username: "DriftKing", gamertag: "DriftKing_88" },
  { username: "TurboTamer", gamertag: "TurboTamer" },
  { username: "RallyRoo", gamertag: "RallyRoo_AU" },
  { username: "CircuitSage", gamertag: "CircuitSage" },
  { username: "GrippySticks", gamertag: "GrippySticks" },
  { username: "LaunchControl", gamertag: "LaunchCtrl" },
  { username: "ShiftLogic", gamertag: "ShiftLogic" },
  { username: "OversteerOvid", gamertag: "OversteerOvid" },
  { username: "CamberQueen", gamertag: "CamberQueen" },
  { username: "RedlineRay", gamertag: "RedlineRay" },
  { username: "PitLanePat", gamertag: "PitLanePat" },
  { username: "BoostBandit", gamertag: "BoostBandit" },
  { username: "TractionTara", gamertag: "TractionTara" },
];

/**
 * Builds a stable base62-ish slug from a fixture index. Deterministic so
 * local dev and demo URLs stay bookmarkable across reloads.
 */
function demoSlug(index: number): string {
  return `demo${String(index).padStart(6, "0")}`;
}

function buildUsers(): UserRow[] {
  return SPECS.map((spec, index) => ({
    id: 1001 + index,
    public_slug: demoSlug(1001 + index),
    username: spec.username,
    avatar_url: null,
    forza_gamertag: spec.gamertag,
    created_at: new Date(BASE_CREATED - index * 86_400_000).toISOString(),
    banned_at: null,
    ban_reason: null,
  }));
}

export const DEMO_USERS: UserRow[] = buildUsers();

export const DEMO_VIEWER_USER: UserRow = {
  id: 1,
  public_slug: demoSlug(1),
  username: "DemoViewer",
  avatar_url: null,
  forza_gamertag: "DemoViewer",
  created_at: new Date(BASE_CREATED).toISOString(),
  banned_at: null,
  ban_reason: null,
};
