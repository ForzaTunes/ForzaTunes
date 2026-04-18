import { DatabaseClient } from "./DatabaseClient";

interface GameSeedEntry {
  slug: string;
  name: string;
  shareCodeLength: number;
}

interface CarSeedEntry {
  make: string;
  model: string;
  year: number;
  category: string;
  imageUrl?: string | null;
  imageKey?: string | null;
}

export class DatabaseSeeder {
  private databaseClient: DatabaseClient;

  constructor(databaseClient: DatabaseClient) {
    this.databaseClient = databaseClient;
  }

  async seedGames(games: GameSeedEntry[]): Promise<void> {
    for (const game of games) {
      await this.databaseClient.execute(
        `INSERT OR REPLACE INTO games (name, slug, share_code_length)
         VALUES (?, ?, ?)`,
        [game.name, game.slug, game.shareCodeLength],
      );
    }
  }

  async seedCarsForGame(
    gameSlug: string,
    cars: CarSeedEntry[],
  ): Promise<void> {
    const game = await this.databaseClient.queryOne<{ id: number }>(
      `SELECT id FROM games WHERE slug = ?`,
      [gameSlug],
    );

    if (!game) {
      throw new Error(`Game not found for slug: ${gameSlug}`);
    }

    for (const car of cars) {
      await this.databaseClient.execute(
        `INSERT OR IGNORE INTO cars (game_id, make, model, year, category, image_url, image_key)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          game.id,
          car.make,
          car.model,
          car.year,
          car.category,
          car.imageUrl ?? null,
          car.imageKey ?? null,
        ],
      );
    }
  }

  async seedAll(
    games: GameSeedEntry[],
    carsBySlug: Record<string, CarSeedEntry[]>,
  ): Promise<void> {
    await this.seedGames(games);

    for (const game of games) {
      const cars = carsBySlug[game.slug];
      if (cars && cars.length > 0) {
        await this.seedCarsForGame(game.slug, cars);
      }
    }
  }
}
