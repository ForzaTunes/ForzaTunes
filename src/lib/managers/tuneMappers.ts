import type { Drivetrain, Tune, TuneWithDetails } from "../models";

export interface TuneWithDetailsRow {
  id: number;
  game_id: number;
  share_code: string;
  car_id: number;
  title: string;
  description: string | null;
  creator_gamertag: string;
  tune_type: string;
  pi_rating: number;
  car_class: string;
  drivetrain: string | null;
  track_name: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_category: string | null;
  car_image_url: string | null;
  creator_username: string;
  star_count: number;
}

export interface TuneRow {
  id: number;
  game_id: number;
  share_code: string;
  car_id: number;
  title: string;
  description: string | null;
  creator_gamertag: string;
  tune_type: string;
  pi_rating: number;
  car_class: string;
  drivetrain: string | null;
  track_name: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

function toDrivetrain(value: string | null): Drivetrain | null {
  if (value === "FWD" || value === "RWD" || value === "AWD") return value;
  return null;
}

export function mapRowToTune(row: TuneRow): Tune {
  return {
    id: row.id,
    gameId: row.game_id,
    shareCode: row.share_code,
    carId: row.car_id,
    title: row.title,
    description: row.description,
    creatorGamertag: row.creator_gamertag,
    tuneType: row.tune_type,
    piRating: row.pi_rating,
    carClass: row.car_class,
    drivetrain: toDrivetrain(row.drivetrain),
    trackName: row.track_name,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRowToTuneWithDetails(
  row: TuneWithDetailsRow,
): TuneWithDetails {
  return {
    id: row.id,
    gameId: row.game_id,
    shareCode: row.share_code,
    carId: row.car_id,
    title: row.title,
    description: row.description,
    creatorGamertag: row.creator_gamertag,
    tuneType: row.tune_type,
    piRating: row.pi_rating,
    carClass: row.car_class,
    drivetrain: toDrivetrain(row.drivetrain),
    trackName: row.track_name,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    carMake: row.car_make,
    carModel: row.car_model,
    carYear: row.car_year,
    carCategory: row.car_category,
    carImageUrl: row.car_image_url,
    starCount: row.star_count,
    creatorUsername: row.creator_username,
  };
}
