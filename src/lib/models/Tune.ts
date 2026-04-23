export type Drivetrain = "FWD" | "RWD" | "AWD";

export interface Tune {
  id: number;
  gameId: number;
  shareCode: string;
  carId: number;
  title: string;
  description: string | null;
  creatorGamertag: string;
  tuneType: string;
  piRating: number;
  carClass: string;
  drivetrain: Drivetrain | null;
  trackName: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  sourceUrl: string | null;
  importedAt: string | null;
}

export interface TuneWithDetails extends Tune {
  carMake: string;
  carModel: string;
  carYear: number;
  carCategory: string | null;
  carImageUrl: string | null;
  carImageKey: string | null;
  starCount: number;
  creatorUsername: string;
  creatorPublicSlug: string;
}

export interface TuneSearchFilters {
  query?: string;
  tuneTypes?: string[];
  carClasses?: string[];
  makes?: string[];
  drivetrains?: Drivetrain[];
  piMin?: number;
  piMax?: number;
  carId?: number;
}

export type TuneSortField = "newest" | "most_starred" | "pi_asc" | "pi_desc";

export interface TunePagination {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
