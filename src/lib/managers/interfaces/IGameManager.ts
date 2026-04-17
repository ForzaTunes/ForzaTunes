import type { Game, GameConfig } from "../../models";

export interface IGameManager {
  getAll(): Promise<Game[]>;
  getBySlug(slug: string): Promise<Game | null>;
  getById(id: number): Promise<Game | null>;
  getConfig(slug: string): GameConfig | null;
  getAllConfigs(): GameConfig[];
}
