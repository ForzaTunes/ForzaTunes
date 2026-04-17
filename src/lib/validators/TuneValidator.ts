import { ShareCodeValidator } from "./ShareCodeValidator";
import { CarClassResolver } from "../managers/CarClassResolver";
import type { Drivetrain, GameConfig } from "../models";

const VALID_DRIVETRAINS: readonly Drivetrain[] = ["FWD", "RWD", "AWD"];

export interface TuneSubmission {
  shareCode: string;
  carId: number;
  title: string;
  description?: string;
  tuneType: string;
  piRating: number;
  drivetrain?: string;
  trackName?: string;
}

export interface TuneValidationResult {
  valid: boolean;
  errors: string[];
  normalized?: {
    shareCode: string;
    drivetrain: Drivetrain | null;
    trackName: string | null;
  };
}

export class TuneValidator {
  private shareCodeValidator = new ShareCodeValidator();

  validate(input: TuneSubmission, gameConfig: GameConfig): TuneValidationResult {
    const errors: string[] = [];
    let normalizedShareCode = "";

    const scResult = this.shareCodeValidator.validate(
      input.shareCode,
      gameConfig.shareCodeLength,
    );
    if (!scResult.valid) {
      errors.push(scResult.error ?? "Invalid share code");
    } else {
      normalizedShareCode = scResult.normalized;
    }

    this.validateTitle(input.title, errors);
    this.validateDescription(input.description, errors);

    const validTuneTypes = gameConfig.tuneTypes.map((t) => t.value);
    if (!input.tuneType || !validTuneTypes.includes(input.tuneType)) {
      errors.push(`Tune type must be one of: ${validTuneTypes.join(", ")}`);
    }

    this.validatePiRating(input.piRating, gameConfig, errors);

    if (!input.carId || !Number.isInteger(input.carId) || input.carId <= 0) {
      errors.push("A valid car must be selected");
    }

    let normalizedDrivetrain: Drivetrain | null = null;
    if (
      typeof input.drivetrain !== "string" ||
      input.drivetrain === "" ||
      !VALID_DRIVETRAINS.includes(input.drivetrain as Drivetrain)
    ) {
      errors.push(`Drivetrain must be one of: ${VALID_DRIVETRAINS.join(", ")}`);
    } else {
      normalizedDrivetrain = input.drivetrain as Drivetrain;
    }

    const normalizedTrack = this.validateTrack(input.trackName, errors);

    return {
      valid: errors.length === 0,
      errors,
      normalized:
        errors.length === 0
          ? {
              shareCode: normalizedShareCode,
              drivetrain: normalizedDrivetrain,
              trackName: normalizedTrack,
            }
          : undefined,
    };
  }

  private validateTitle(title: string | undefined, errors: string[]): void {
    if (!title || typeof title !== "string") {
      errors.push("Title is required");
      return;
    }
    if (title.trim().length === 0) {
      errors.push("Title cannot be empty");
    } else if (title.trim().length > 100) {
      errors.push("Title must be 100 characters or fewer");
    }
  }

  private validateDescription(
    description: string | undefined,
    errors: string[],
  ): void {
    if (description === undefined || description === null) return;
    if (typeof description !== "string") {
      errors.push("Description must be a string");
    } else if (description.length > 2000) {
      errors.push("Description must be 2000 characters or fewer");
    }
  }

  private validatePiRating(
    piRating: number,
    gameConfig: GameConfig,
    errors: string[],
  ): void {
    if (piRating === undefined || piRating === null || isNaN(piRating)) {
      errors.push("PI rating is required");
      return;
    }
    if (!Number.isInteger(piRating)) {
      errors.push("PI rating must be a whole number");
      return;
    }
    if (
      piRating < gameConfig.piRange.min ||
      piRating > gameConfig.piRange.max
    ) {
      errors.push(
        `PI rating must be between ${gameConfig.piRange.min} and ${gameConfig.piRange.max}`,
      );
      return;
    }
    if (!CarClassResolver.findRange(gameConfig.classRanges, piRating)) {
      errors.push(
        `PI ${piRating} does not correspond to any class for ${gameConfig.slug}`,
      );
    }
  }

  private validateTrack(
    trackName: string | undefined,
    errors: string[],
  ): string | null {
    if (trackName === undefined || trackName === null || trackName === "") {
      return null;
    }
    if (typeof trackName !== "string") {
      errors.push("Track name must be a string");
      return null;
    }
    const trimmed = trackName.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > 100) {
      errors.push("Track name must be 100 characters or fewer");
      return null;
    }
    return trimmed;
  }
}
