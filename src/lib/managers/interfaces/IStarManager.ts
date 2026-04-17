import type { TuneSortField, TuneWithDetails } from "../../models";

export interface StarredTunesQuery {
  gameId?: number;
  sort?: TuneSortField;
}

export interface IStarManager {
  star(userId: number, tuneId: number): Promise<void>;
  unstar(userId: number, tuneId: number): Promise<void>;
  toggleStar(userId: number, tuneId: number): Promise<boolean>;
  isStarred(userId: number, tuneId: number): Promise<boolean>;
  getStarCount(tuneId: number): Promise<number>;
  countReceivedByUser(userId: number): Promise<number>;
  getUserStarredTuneIds(
    userId: number,
    tuneIds: number[],
  ): Promise<Set<number>>;
  getStarredTunes(
    userId: number,
    limit: number,
    offset: number,
    opts?: StarredTunesQuery,
  ): Promise<TuneWithDetails[]>;
}
