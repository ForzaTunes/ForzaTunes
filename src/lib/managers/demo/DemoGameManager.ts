import type { Game, GameConfig } from "../../models";
import type { IGameManager } from "../interfaces";
import {
  getDemoGameConfigs,
  getDemoGames,
} from "../../fixtures/GameFixtures";

export class DemoGameManager implements IGameManager {
  async getAll(): Promise<Game[]> {
    return getDemoGames();
  }

  async getBySlug(slug: string): Promise<Game | null> {
    return getDemoGames().find((g) => g.slug === slug) ?? null;
  }

  async getById(id: number): Promise<Game | null> {
    return getDemoGames().find((g) => g.id === id) ?? null;
  }

  getConfig(slug: string): GameConfig | null {
    return getDemoGameConfigs().find((g) => g.slug === slug) ?? null;
  }

  getAllConfigs(): GameConfig[] {
    return getDemoGameConfigs();
  }
}
