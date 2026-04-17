import type {
  Drivetrain,
  TuneWithDetails,
  TuneSearchFilters,
  TuneSortField,
  TunePagination,
  PaginatedResult,
} from "../../models";

export interface ValidatedTuneSubmission {
  gameId: number;
  shareCode: string;
  carId: number;
  title: string;
  description: string | null;
  tuneType: string;
  creatorGamertag: string;
  piRating: number;
  carClass: string;
  drivetrain: Drivetrain | null;
  trackName: string | null;
  userId: number;
}

export interface TuneUpdateInput {
  title: string;
  description: string | null;
  tuneType: string;
  creatorGamertag: string;
  piRating: number;
  carClass: string;
  drivetrain: Drivetrain | null;
  trackName: string | null;
}

export interface UserTunesQuery {
  gameId?: number;
  sort?: TuneSortField;
}

export interface ITuneManager {
  search(
    gameId: number,
    filters: TuneSearchFilters,
    sort: TuneSortField,
    pagination: TunePagination,
  ): Promise<PaginatedResult<TuneWithDetails>>;
  getById(id: number): Promise<TuneWithDetails | null>;
  getRecent(gameId: number, limit: number): Promise<TuneWithDetails[]>;
  getRecentAcrossGames(limit: number): Promise<TuneWithDetails[]>;
  getTrendingAcrossGames(
    sinceDays: number,
    limit: number,
  ): Promise<TuneWithDetails[]>;
  getTrending(
    gameId: number,
    sinceDays: number,
    limit: number,
  ): Promise<TuneWithDetails[]>;
  getByUser(
    userId: number,
    limit: number,
    offset: number,
    opts?: UserTunesQuery,
  ): Promise<TuneWithDetails[]>;
  countByGame(gameId: number): Promise<number>;
  countByUser(userId: number): Promise<number>;
  create(input: ValidatedTuneSubmission): Promise<number>;
  update(id: number, userId: number, input: TuneUpdateInput): Promise<boolean>;
  delete(id: number, userId: number): Promise<boolean>;
}
