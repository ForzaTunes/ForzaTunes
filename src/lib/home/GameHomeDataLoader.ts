import type { Managers } from "../ManagerFactory";
import type { Game, GameConfig, TuneWithDetails } from "../models";
import { GameReleaseStatus } from "../utils/gameReleaseStatus";

export interface GameHomeData {
  game: Game;
  config: GameConfig;
  tuneCount: number;
  spotlight: TuneWithDetails | null;
  spotlightSource: "trending" | "all_time" | null;
  recentTunes: TuneWithDetails[];
  isPreLaunch: boolean;
  daysUntilPlayable: number | null;
  viewerStarredIds: Set<number>;
}

export interface GameHomeLoadOptions {
  gameSlug: string;
  viewerId: number | null;
}

const TRENDING_WINDOW_DAYS = 7;
const RECENT_TUNES_LIMIT = 3;

export class GameHomeDataLoader {
  constructor(
    private readonly managers: Managers,
    private readonly release: GameReleaseStatus = new GameReleaseStatus(),
  ) {}

  async load(opts: GameHomeLoadOptions): Promise<GameHomeData | null> {
    const { gameSlug, viewerId } = opts;

    const game = await this.managers.games.getBySlug(gameSlug);
    if (!game) return null;

    const config = this.managers.games.getConfig(gameSlug);
    if (!config) return null;

    const isPreLaunch = this.release.isPreLaunch(config);
    const daysUntilPlayable = this.release.daysUntilPlayable(config);

    const [tuneCount, spotlightResult, recentTunes] = await Promise.all([
      this.managers.tunes.countByGame(game.id),
      isPreLaunch
        ? Promise.resolve({ tune: null, source: null } as const)
        : this.loadSpotlight(game.id),
      isPreLaunch
        ? Promise.resolve<TuneWithDetails[]>([])
        : this.loadRecent(game.id),
    ]);

    const viewerStarredIds = await this.loadViewerStarredIds(
      viewerId,
      spotlightResult.tune,
      recentTunes,
    );

    return {
      game,
      config,
      tuneCount,
      spotlight: spotlightResult.tune,
      spotlightSource: spotlightResult.source,
      recentTunes,
      isPreLaunch,
      daysUntilPlayable,
      viewerStarredIds,
    };
  }

  private async loadSpotlight(gameId: number): Promise<{
    tune: TuneWithDetails | null;
    source: "trending" | "all_time" | null;
  }> {
    const trending = await this.managers.tunes.getTrending(
      gameId,
      TRENDING_WINDOW_DAYS,
      1,
    );
    if (trending.length > 0) {
      return { tune: trending[0], source: "trending" };
    }

    const fallback = await this.managers.tunes.search(
      gameId,
      {},
      "most_starred",
      { page: 1, pageSize: 1 },
    );
    if (fallback.items.length > 0) {
      return { tune: fallback.items[0], source: "all_time" };
    }

    return { tune: null, source: null };
  }

  private async loadRecent(gameId: number): Promise<TuneWithDetails[]> {
    const result = await this.managers.tunes.search(gameId, {}, "newest", {
      page: 1,
      pageSize: RECENT_TUNES_LIMIT,
    });
    return result.items;
  }

  private async loadViewerStarredIds(
    viewerId: number | null,
    spotlight: TuneWithDetails | null,
    recent: TuneWithDetails[],
  ): Promise<Set<number>> {
    if (!viewerId) return new Set<number>();

    const ids = new Set<number>();
    if (spotlight) ids.add(spotlight.id);
    for (const tune of recent) ids.add(tune.id);
    if (ids.size === 0) return new Set<number>();

    return this.managers.stars.getUserStarredTuneIds(
      viewerId,
      Array.from(ids),
    );
  }
}
