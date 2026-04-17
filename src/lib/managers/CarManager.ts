import type { DatabaseClient } from "../db/DatabaseClient";
import type { Car } from "../models";
import type { CarFilters, ICarManager } from "./interfaces";

export type { CarFilters } from "./interfaces";

interface CarRow {
  id: number;
  game_id: number;
  make: string;
  model: string;
  year: number;
  category: string | null;
  image_url: string | null;
}

function mapRowToCar(row: CarRow): Car {
  return {
    id: row.id,
    gameId: row.game_id,
    make: row.make,
    model: row.model,
    year: row.year,
    category: row.category,
    imageUrl: row.image_url,
  };
}

export class CarManager implements ICarManager {
  constructor(private db: DatabaseClient) {}

  async getByGame(gameId: number, filters?: CarFilters): Promise<Car[]> {
    const rows = await this.db.query<CarRow>(
      `SELECT id, game_id, make, model, year, category, image_url
       FROM cars
       WHERE game_id = ?1
         AND (?2 IS NULL OR make = ?2)
         AND (?3 IS NULL OR category = ?3)
       ORDER BY make ASC, model ASC`,
      [gameId, filters?.make ?? null, filters?.category ?? null],
    );
    return rows.map(mapRowToCar);
  }

  async getById(id: number): Promise<Car | null> {
    const row = await this.db.queryOne<CarRow>(
      "SELECT id, game_id, make, model, year, category, image_url FROM cars WHERE id = ?1",
      [id],
    );
    return row ? mapRowToCar(row) : null;
  }

  async getMakes(gameId: number): Promise<string[]> {
    const rows = await this.db.query<{ make: string }>(
      "SELECT DISTINCT make FROM cars WHERE game_id = ?1 ORDER BY make ASC",
      [gameId],
    );
    return rows.map((r) => r.make);
  }

  async getCategories(gameId: number): Promise<string[]> {
    const rows = await this.db.query<{ category: string }>(
      "SELECT DISTINCT category FROM cars WHERE game_id = ?1 AND category IS NOT NULL ORDER BY category ASC",
      [gameId],
    );
    return rows.map((r) => r.category);
  }
}
