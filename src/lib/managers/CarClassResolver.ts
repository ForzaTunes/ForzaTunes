import type { ClassRange, GameConfig } from "../models";
import type { IGameManager } from "./interfaces";

export class CarClassResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CarClassResolutionError";
  }
}

export class CarClassResolver {
  constructor(private readonly gameManager: IGameManager) {}

  resolveClass(gameSlug: string, piRating: number): string {
    const config = this.gameManager.getConfig(gameSlug);
    if (!config) {
      throw new CarClassResolutionError(`Unknown game: ${gameSlug}`);
    }
    return CarClassResolver.resolveFromConfig(config, piRating);
  }

  static resolveFromConfig(config: GameConfig, piRating: number): string {
    if (!Number.isInteger(piRating)) {
      throw new CarClassResolutionError("PI rating must be an integer");
    }

    const match = CarClassResolver.findRange(config.classRanges, piRating);
    if (!match) {
      throw new CarClassResolutionError(
        `PI ${piRating} is outside the valid range for ${config.slug}`,
      );
    }
    return match.class;
  }

  static findRange(
    ranges: readonly ClassRange[],
    piRating: number,
  ): ClassRange | null {
    for (const range of ranges) {
      if (piRating >= range.min && piRating <= range.max) {
        return range;
      }
    }
    return null;
  }
}
