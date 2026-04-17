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
  playableFromUtc?: string;
  trackFieldLabel?: string;
  trackFieldHint?: string;
  tuneTypes: TuneTypeOption[];
  classRanges: ClassRange[];
  piRange: PiRange;
}
