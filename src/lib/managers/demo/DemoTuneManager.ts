import type {
  PaginatedResult,
  Tune,
  TunePagination,
  TuneSearchFilters,
  TuneSortField,
  TuneWithDetails,
} from "../../models";
import type {
  ITuneManager,
  TuneUpdateInput,
  UserTunesQuery,
  ValidatedTuneSubmission,
} from "../interfaces";
import { DEMO_CARS } from "../../fixtures/CarFixtures";
import { DemoStore } from "./DemoStore";

export class DemoTuneManager implements ITuneManager {
  constructor(private store: DemoStore) {}

  async search(
    gameId: number,
    filters: TuneSearchFilters,
    sort: TuneSortField,
    pagination: TunePagination,
  ): Promise<PaginatedResult<TuneWithDetails>> {
    const filtered = this.store.tunes
      .filter((t) => t.gameId === gameId)
      .filter((t) => matchFilters(t, filters));

    const decorated = filtered.map((t) => this.decorate(t));
    const sorted = sortTunes(decorated, sort);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
    const start = (pagination.page - 1) * pagination.pageSize;
    const items = sorted.slice(start, start + pagination.pageSize);

    return {
      items,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
    };
  }

  async getById(id: number): Promise<TuneWithDetails | null> {
    const tune = this.store.tunes.find((t) => t.id === id);
    return tune ? this.decorate(tune) : null;
  }

  async getRecent(
    gameId: number,
    limit: number,
  ): Promise<TuneWithDetails[]> {
    return sortByCreatedDesc(this.store.tunes.filter((t) => t.gameId === gameId))
      .slice(0, limit)
      .map((t) => this.decorate(t));
  }

  async getRecentAcrossGames(limit: number): Promise<TuneWithDetails[]> {
    return sortByCreatedDesc(this.store.tunes)
      .slice(0, limit)
      .map((t) => this.decorate(t));
  }

  async getTrendingAcrossGames(
    sinceDays: number,
    limit: number,
  ): Promise<TuneWithDetails[]> {
    const cutoff = Date.now() - sinceDays * 86_400_000;
    const recent = this.store.tunes.filter(
      (t) => Date.parse(t.createdAt) >= cutoff,
    );
    const decorated = recent.map((t) => this.decorate(t));
    decorated.sort((a, b) => {
      if (b.starCount !== a.starCount) return b.starCount - a.starCount;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    return decorated.slice(0, limit);
  }

  async getTrending(
    gameId: number,
    sinceDays: number,
    limit: number,
  ): Promise<TuneWithDetails[]> {
    const cutoff = Date.now() - sinceDays * 86_400_000;
    const recent = this.store.tunes.filter(
      (t) => t.gameId === gameId && Date.parse(t.createdAt) >= cutoff,
    );
    const decorated = recent.map((t) => this.decorate(t));
    decorated.sort((a, b) => {
      if (b.starCount !== a.starCount) return b.starCount - a.starCount;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
    return decorated.slice(0, limit);
  }

  async getByUser(
    userId: number,
    limit: number,
    offset: number,
    opts?: UserTunesQuery,
  ): Promise<TuneWithDetails[]> {
    const gameId = opts?.gameId;
    const sort = opts?.sort ?? "newest";
    const mine = this.store.tunes
      .filter((t) => t.userId === userId)
      .filter((t) => gameId === undefined || t.gameId === gameId);
    const decorated = mine.map((t) => this.decorate(t));
    return sortTunes(decorated, sort).slice(offset, offset + limit);
  }

  async countByGame(gameId: number): Promise<number> {
    return this.store.tunes.filter((t) => t.gameId === gameId).length;
  }

  async countByUser(userId: number): Promise<number> {
    return this.store.tunes.filter((t) => t.userId === userId).length;
  }

  async create(input: ValidatedTuneSubmission): Promise<number> {
    const car = DEMO_CARS.find((c) => c.id === input.carId);
    if (!car || car.gameId !== input.gameId) {
      throw new Error("Car does not belong to the target game");
    }

    const now = new Date().toISOString();
    const id = this.store.allocateTuneId();
    const tune: Tune = {
      id,
      gameId: input.gameId,
      shareCode: input.shareCode,
      carId: input.carId,
      title: input.title,
      description: input.description,
      creatorGamertag: input.creatorGamertag,
      tuneType: input.tuneType,
      piRating: input.piRating,
      carClass: input.carClass,
      drivetrain: input.drivetrain,
      trackName: input.trackName,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.tunes.unshift(tune);
    return id;
  }

  async update(
    id: number,
    userId: number,
    input: TuneUpdateInput,
  ): Promise<boolean> {
    const tune = this.store.tunes.find(
      (t) => t.id === id && t.userId === userId,
    );
    if (!tune) return false;
    tune.title = input.title;
    tune.description = input.description;
    tune.tuneType = input.tuneType;
    tune.creatorGamertag = input.creatorGamertag;
    tune.piRating = input.piRating;
    tune.carClass = input.carClass;
    tune.drivetrain = input.drivetrain;
    tune.trackName = input.trackName;
    tune.updatedAt = new Date().toISOString();
    return true;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const idx = this.store.tunes.findIndex(
      (t) => t.id === id && t.userId === userId,
    );
    if (idx < 0) return false;
    this.store.tunes.splice(idx, 1);
    this.store.stars = this.store.stars.filter((s) => s.tuneId !== id);
    return true;
  }

  private decorate(tune: Tune): TuneWithDetails {
    const car = DEMO_CARS.find((c) => c.id === tune.carId);
    const creator = this.store.users.find((u) => u.id === tune.userId);
    const starCount = this.store.stars.filter(
      (s) => s.tuneId === tune.id,
    ).length;
    return {
      ...tune,
      carMake: car?.make ?? "Unknown",
      carModel: car?.model ?? "Unknown",
      carYear: car?.year ?? 0,
      carCategory: car?.category ?? null,
      carImageUrl: car?.imageUrl ?? null,
      creatorUsername: creator?.username ?? tune.creatorGamertag,
      starCount,
    };
  }
}

function matchFilters(tune: Tune, filters: TuneSearchFilters): boolean {
  if (filters.tuneTypes && filters.tuneTypes.length > 0) {
    if (!filters.tuneTypes.includes(tune.tuneType)) return false;
  }
  if (filters.carClasses && filters.carClasses.length > 0) {
    if (!filters.carClasses.includes(tune.carClass)) return false;
  }
  if (filters.drivetrains && filters.drivetrains.length > 0) {
    if (!tune.drivetrain || !filters.drivetrains.includes(tune.drivetrain)) {
      return false;
    }
  }
  if (typeof filters.piMin === "number" && tune.piRating < filters.piMin) {
    return false;
  }
  if (typeof filters.piMax === "number" && tune.piRating > filters.piMax) {
    return false;
  }
  if (filters.makes && filters.makes.length > 0) {
    const car = DEMO_CARS.find((c) => c.id === tune.carId);
    if (!car || !filters.makes.includes(car.make)) return false;
  }
  if (typeof filters.carId === "number" && tune.carId !== filters.carId) {
    return false;
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const car = DEMO_CARS.find((c) => c.id === tune.carId);
    const haystack = [
      tune.title,
      tune.creatorGamertag,
      car?.make ?? "",
      car?.model ?? "",
    ]
      .join("\n")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function sortTunes(
  tunes: TuneWithDetails[],
  sort: TuneSortField,
): TuneWithDetails[] {
  const arr = [...tunes];
  switch (sort) {
    case "most_starred":
      arr.sort((a, b) => {
        if (b.starCount !== a.starCount) return b.starCount - a.starCount;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
      return arr;
    case "pi_asc":
      arr.sort((a, b) => {
        if (a.piRating !== b.piRating) return a.piRating - b.piRating;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
      return arr;
    case "pi_desc":
      arr.sort((a, b) => {
        if (a.piRating !== b.piRating) return b.piRating - a.piRating;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
      return arr;
    case "newest":
    default:
      arr.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return arr;
  }
}

function sortByCreatedDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
