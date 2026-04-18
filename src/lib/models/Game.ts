export interface Game {
  id: number;
  name: string;
  slug: string;
  shareCodeLength: number;
  createdAt: string;
}

export interface TuneTypeOption {
  value: string;
  label: string;
}

export interface PiRange {
  min: number;
  max: number;
}

export interface ClassRange {
  class: string;
  min: number;
  max: number;
}

export interface GameConfig {
  slug: string;
  name: string;
  shortName?: string;
  shareCodeLength: number;
  releaseDate?: string;
  /**
   * UTC instant the playable gate opens. Set this to the advertised Early
   * Access calendar date at `T00:00:00Z` so formatting in UTC renders that
   * date directly (no separate display field needed).
   */
  playableFromUtc?: string;
  trackFieldLabel?: string;
  trackFieldHint?: string;
  tuneTypes: TuneTypeOption[];
  classRanges: ClassRange[];
  piRange: PiRange;
}
