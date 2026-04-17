import type { Game, GameConfig } from "../models";
import gamesJson from "../../data/games.json";

const GAMES_CONFIG = gamesJson as GameConfig[];

const BASE_CREATED = new Date("2024-11-01T00:00:00Z").toISOString();

export function getDemoGameConfigs(): GameConfig[] {
  return GAMES_CONFIG;
}

export function getDemoGames(): Game[] {
  return GAMES_CONFIG.map((config, index) => ({
    id: index + 1,
    name: config.name,
    slug: config.slug,
    shareCodeLength: config.shareCodeLength,
    createdAt: BASE_CREATED,
  }));
}

export function getDemoGameIdBySlug(slug: string): number | null {
  const index = GAMES_CONFIG.findIndex((g) => g.slug === slug);
  return index < 0 ? null : index + 1;
}
