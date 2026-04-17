import type { DatabaseClient } from "../db/DatabaseClient";
import type { Game, GameConfig } from "../models";
import type { IGameManager } from "./interfaces";
import gamesJson from "../../data/games.json";

interface GameRow {
  id: number;
  name: string;
  slug: string;
  share_code_length: number;
  created_at: string;
}

function mapRowToGame(row: GameRow): Game {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shareCodeLength: row.share_code_length,
    createdAt: row.created_at,
  };
}

export class GameManager implements IGameManager {
  constructor(private db: DatabaseClient) {}

  async getAll(): Promise<Game[]> {
    const rows = await this.db.query<GameRow>(
      "SELECT id, name, slug, share_code_length, created_at FROM games ORDER BY name ASC",
    );
    return rows.map(mapRowToGame);
  }

  async getBySlug(slug: string): Promise<Game | null> {
    const row = await this.db.queryOne<GameRow>(
      "SELECT id, name, slug, share_code_length, created_at FROM games WHERE slug = ?1",
      [slug],
    );
    return row ? mapRowToGame(row) : null;
  }

  async getById(id: number): Promise<Game | null> {
    const row = await this.db.queryOne<GameRow>(
      "SELECT id, name, slug, share_code_length, created_at FROM games WHERE id = ?1",
      [id],
    );
    return row ? mapRowToGame(row) : null;
  }

  getConfig(slug: string): GameConfig | null {
    const entry = (gamesJson as GameConfig[]).find((g) => g.slug === slug);
    return entry ?? null;
  }

  getAllConfigs(): GameConfig[] {
    return gamesJson as GameConfig[];
  }
}
