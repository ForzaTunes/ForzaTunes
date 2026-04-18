import type { TuneSortField, TuneWithDetails } from "../../models";
import type { IStarManager, StarredTunesQuery } from "../interfaces";
import { DEMO_CARS } from "../../fixtures/CarFixtures";
import { DemoStore } from "./DemoStore";

export class DemoStarManager implements IStarManager {
  constructor(private store: DemoStore) {}

  async star(userId: number, tuneId: number): Promise<void> {
    if (this.existing(userId, tuneId)) return;
    this.store.stars.push({
      id: this.store.allocateStarId(),
      userId,
      tuneId,
      createdAt: new Date().toISOString(),
    });
  }

  async unstar(userId: number, tuneId: number): Promise<void> {
    this.store.stars = this.store.stars.filter(
      (s) => !(s.userId === userId && s.tuneId === tuneId),
    );
  }

  async toggleStar(userId: number, tuneId: number): Promise<boolean> {
    if (this.existing(userId, tuneId)) {
      await this.unstar(userId, tuneId);
      return false;
    }
    await this.star(userId, tuneId);
    return true;
  }

  async isStarred(userId: number, tuneId: number): Promise<boolean> {
    return this.existing(userId, tuneId);
  }

  async getStarCount(tuneId: number): Promise<number> {
    return this.store.stars.filter((s) => s.tuneId === tuneId).length;
  }

  async countReceivedByUser(userId: number): Promise<number> {
    const tuneIds = new Set(
      this.store.tunes.filter((t) => t.userId === userId).map((t) => t.id),
    );
    return this.store.stars.filter((s) => tuneIds.has(s.tuneId)).length;
  }

  async getUserStarredTuneIds(
    userId: number,
    tuneIds: number[],
  ): Promise<Set<number>> {
    if (tuneIds.length === 0) return new Set();
    const wanted = new Set(tuneIds);
    const out = new Set<number>();
    for (const star of this.store.stars) {
      if (star.userId === userId && wanted.has(star.tuneId)) {
        out.add(star.tuneId);
      }
    }
    return out;
  }

  async getStarredTunes(
    userId: number,
    limit: number,
    offset: number,
    opts?: StarredTunesQuery,
  ): Promise<TuneWithDetails[]> {
    const gameId = opts?.gameId;
    const sort: TuneSortField = opts?.sort ?? "newest";

    const myStars = this.store.stars.filter((s) => s.userId === userId);

    const items: Array<{ starredAt: number; tune: TuneWithDetails }> = [];
    for (const star of myStars) {
      const tune = this.store.tunes.find((t) => t.id === star.tuneId);
      if (!tune) continue;
      if (typeof gameId === "number" && tune.gameId !== gameId) continue;
      const car = DEMO_CARS.find((c) => c.id === tune.carId);
      const creator = this.store.users.find((u) => u.id === tune.userId);
      items.push({
        starredAt: Date.parse(star.createdAt),
        tune: {
          ...tune,
          carMake: car?.make ?? "Unknown",
          carModel: car?.model ?? "Unknown",
          carYear: car?.year ?? 0,
          carCategory: car?.category ?? null,
          carImageUrl: car?.imageUrl ?? null,
          carImageKey: car?.imageKey ?? null,
          creatorUsername: creator?.username ?? tune.creatorGamertag,
          creatorPublicSlug: creator?.public_slug ?? "",
          starCount: this.store.stars.filter((s) => s.tuneId === tune.id)
            .length,
        },
      });
    }

    sortStarredItems(items, sort);
    return items.slice(offset, offset + limit).map((i) => i.tune);
  }

  private existing(userId: number, tuneId: number): boolean {
    return this.store.stars.some(
      (s) => s.userId === userId && s.tuneId === tuneId,
    );
  }
}

function sortStarredItems(
  items: Array<{ starredAt: number; tune: TuneWithDetails }>,
  sort: TuneSortField,
): void {
  switch (sort) {
    case "most_starred":
      items.sort((a, b) => {
        if (b.tune.starCount !== a.tune.starCount) {
          return b.tune.starCount - a.tune.starCount;
        }
        return b.starredAt - a.starredAt;
      });
      return;
    case "pi_asc":
      items.sort((a, b) => {
        if (a.tune.piRating !== b.tune.piRating) {
          return a.tune.piRating - b.tune.piRating;
        }
        return b.starredAt - a.starredAt;
      });
      return;
    case "pi_desc":
      items.sort((a, b) => {
        if (a.tune.piRating !== b.tune.piRating) {
          return b.tune.piRating - a.tune.piRating;
        }
        return b.starredAt - a.starredAt;
      });
      return;
    case "newest":
    default:
      items.sort((a, b) => b.starredAt - a.starredAt);
  }
}
