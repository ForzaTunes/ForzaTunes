import type { Managers } from "../ManagerFactory";
import type {
  Game,
  GameConfig,
  TuneSortField,
  TuneWithDetails,
  UserProfile,
} from "../models";

export type ProfileTab = "tunes" | "starred";

export interface ProfileStats {
  tuneCount: number;
  starsReceived: number;
  memberSince: string;
}

export interface ProfileTuneItem extends TuneWithDetails {
  gameSlug: string;
}

export interface ProfileGameOption {
  id: number;
  slug: string;
  name: string;
}

export interface ProfileData {
  profileUser: UserProfile | null;
  stats: ProfileStats;
  tunes: ProfileTuneItem[];
  starredTuneIds: Set<number>;
  gameConfigsBySlug: Map<string, GameConfig>;
  availableGames: ProfileGameOption[];
  resolvedGameId: number | null;
  totalItems: number;
  totalPages: number;
}

export interface ProfileLoadOptions {
  profileUserId: number;
  viewerId: number | null;
  activeTab: ProfileTab;
  page: number;
  limit: number;
  gameSlug?: string | null;
  sort?: TuneSortField;
}

export class ProfileDataLoader {
  constructor(private managers: Managers) {}

  async load(opts: ProfileLoadOptions): Promise<ProfileData> {
    const {
      profileUserId,
      viewerId,
      activeTab,
      page,
      limit,
      gameSlug,
      sort = "newest",
    } = opts;

    const profileUser = await this.managers.users.getProfile(profileUserId);
    if (!profileUser) {
      return this.emptyResult();
    }

    const games = await this.managers.games.getAll();
    const availableGames = this.toOptions(games);
    const resolvedGameId = this.resolveGameId(games, gameSlug);

    const offset = (page - 1) * limit;

    const [tuneCount, starsReceived, tunesRaw, totalItems] = await Promise.all([
      this.managers.tunes.countByUser(profileUserId),
      this.managers.stars.countReceivedByUser(profileUserId),
      this.loadTabTunes(
        profileUserId,
        activeTab,
        limit,
        offset,
        resolvedGameId,
        sort,
      ),
      this.countTabTunes(profileUserId, activeTab, resolvedGameId),
    ]);

    const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;

    const gameSlugMap = new Map(games.map((g) => [g.id, g.slug]));
    const tunes: ProfileTuneItem[] = tunesRaw.map((t) => ({
      ...t,
      gameSlug: gameSlugMap.get(t.gameId) ?? "fh5",
    }));

    const starredTuneIds = viewerId
      ? await this.managers.stars.getUserStarredTuneIds(
          viewerId,
          tunes.map((t) => t.id),
        )
      : new Set<number>();

    const configs = this.managers.games.getAllConfigs();
    const gameConfigsBySlug = new Map<string, GameConfig>(
      configs.map((c) => [c.slug, c]),
    );

    return {
      profileUser,
      stats: {
        tuneCount,
        starsReceived,
        memberSince: profileUser.createdAt,
      },
      tunes,
      starredTuneIds,
      gameConfigsBySlug,
      availableGames,
      resolvedGameId,
      totalItems,
      totalPages,
    };
  }

  private async countTabTunes(
    profileUserId: number,
    activeTab: ProfileTab,
    gameId: number | null,
  ): Promise<number> {
    const opts = gameId !== null ? { gameId } : undefined;
    if (activeTab === "starred") {
      return this.managers.stars.countStarredByUser(profileUserId, opts);
    }
    return this.managers.tunes.countByUser(profileUserId, opts);
  }

  private async loadTabTunes(
    profileUserId: number,
    activeTab: ProfileTab,
    limit: number,
    offset: number,
    gameId: number | null,
    sort: TuneSortField,
  ): Promise<TuneWithDetails[]> {
    if (activeTab === "starred") {
      return this.managers.stars.getStarredTunes(profileUserId, limit, offset, {
        gameId: gameId ?? undefined,
        sort,
      });
    }
    return this.managers.tunes.getByUser(profileUserId, limit, offset, {
      gameId: gameId ?? undefined,
      sort,
    });
  }

  private resolveGameId(
    games: Game[],
    gameSlug: string | null | undefined,
  ): number | null {
    if (!gameSlug) return null;
    const match = games.find((g) => g.slug === gameSlug);
    return match ? match.id : null;
  }

  private toOptions(games: Game[]): ProfileGameOption[] {
    return games.map((g) => ({ id: g.id, slug: g.slug, name: g.name }));
  }

  private emptyResult(): ProfileData {
    return {
      profileUser: null,
      stats: { tuneCount: 0, starsReceived: 0, memberSince: "" },
      tunes: [],
      starredTuneIds: new Set(),
      gameConfigsBySlug: new Map(),
      availableGames: [],
      resolvedGameId: null,
      totalItems: 0,
      totalPages: 0,
    };
  }
}
