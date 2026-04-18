import type { ITuneManager } from "../managers/interfaces";
import type { IGameManager } from "../managers/interfaces";

export interface FavouriteGame {
  slug: string;
  shortName: string;
}

/**
 * Best-effort: samples the user's most recent tunes and picks the game slug
 * that appears most often. Used only for OG card flavor text, so approximate
 * accuracy is fine and we avoid adding a new aggregate query to D1.
 */
export class ProfileFavouriteGameResolver {
  private static readonly SAMPLE_SIZE = 50;

  static async resolve(
    userId: number,
    tunes: ITuneManager,
    games: IGameManager,
  ): Promise<FavouriteGame | null> {
    const sample = await tunes.getByUser(
      userId,
      ProfileFavouriteGameResolver.SAMPLE_SIZE,
      0,
    );
    if (sample.length === 0) return null;

    const counts = new Map<number, number>();
    for (const tune of sample) {
      counts.set(tune.gameId, (counts.get(tune.gameId) ?? 0) + 1);
    }

    const [topGameId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    if (topGameId === undefined) return null;

    const game = await games.getById(topGameId);
    if (!game) return null;

    const config = games.getConfig(game.slug);
    return {
      slug: game.slug,
      shortName: config?.shortName ?? game.name,
    };
  }
}
