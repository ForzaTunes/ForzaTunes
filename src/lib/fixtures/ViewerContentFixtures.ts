import type { Drivetrain, GameConfig, Star, Tune } from "../models";
import type { UserRow } from "../managers/interfaces";
import { demoCarsForGame } from "./CarFixtures";
import { DEMO_SEED, SeedRng } from "./seedRng";
import gamesJson from "../../data/games.json";

const CONFIGS = gamesJson as GameConfig[];
const VIEWER_SEED = DEMO_SEED ^ 0x7e1e20;
const DRIVETRAINS: Drivetrain[] = ["FWD", "RWD", "AWD"];

const VIEWER_TITLES = [
  "Daily Driver Spec",
  "Weekend Cruiser",
  "Qualifier Reference",
  "Late-Night Hot Lap",
  "First Tune",
  "Community Favorite",
];

const VIEWER_DESCRIPTIONS: (string | null)[] = [
  "First tune I built — small tweaks from stock.",
  "Works great out of the box; no gearbox changes.",
  "Rear diff a touch tighter than stock for throttle-on rotation.",
  null,
];

function shareCode(rng: SeedRng, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += rng.intBetween(0, 9).toString();
  return out;
}

export interface ViewerContent {
  tunes: Tune[];
  stars: Star[];
}

/**
 * Seeds tunes authored by the demo viewer, stars received on those
 * tunes from other users, and stars the viewer has given to other
 * users' tunes. Makes /profile meaningful in demo mode.
 */
export function generateViewerContent(
  viewer: UserRow,
  otherUsers: UserRow[],
  existingTunes: Tune[],
  startingTuneId: number,
  startingStarId: number,
): ViewerContent {
  const rng = new SeedRng(VIEWER_SEED);
  const tunes: Tune[] = [];
  const stars: Star[] = [];

  let tuneId = startingTuneId;
  let starId = startingStarId;
  const now = Date.now();
  const dayMs = 86_400_000;

  for (let gameIdx = 0; gameIdx < CONFIGS.length; gameIdx++) {
    const config = CONFIGS[gameIdx]!;
    const gameId = gameIdx + 1;
    const cars = demoCarsForGame(gameId);
    if (cars.length === 0) continue;

    const count = gameIdx === 0 ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const car = rng.pick(cars);
      const classRange = rng.pick(config.classRanges);
      const tuneType = rng.pick(config.tuneTypes).value;
      const pi = rng.intBetween(classRange.min, classRange.max);
      const drivetrain = rng.chance(0.85) ? rng.pick(DRIVETRAINS) : null;
      const createdAt = new Date(now - (i + 1) * dayMs).toISOString();

      const tune: Tune = {
        id: tuneId++,
        gameId,
        shareCode: shareCode(rng, config.shareCodeLength),
        carId: car.id,
        title: rng.pick(VIEWER_TITLES),
        description: rng.pick(VIEWER_DESCRIPTIONS),
        creatorGamertag: viewer.forza_gamertag ?? viewer.username,
        tuneType,
        piRating: pi,
        carClass: classRange.class,
        drivetrain,
        trackName: null,
        userId: viewer.id,
        createdAt,
        updatedAt: createdAt,
        sourceUrl: null,
        importedAt: null,
      };
      tunes.push(tune);

      const starCount = rng.intBetween(2, 9);
      const pool = [...otherUsers];
      for (let s = 0; s < starCount && pool.length > 0; s++) {
        const idx = rng.intBetween(0, pool.length - 1);
        const starer = pool.splice(idx, 1)[0]!;
        stars.push({
          id: starId++,
          userId: starer.id,
          tuneId: tune.id,
          createdAt,
        });
      }
    }
  }

  const givenCount = Math.min(6, existingTunes.length);
  const givenPool = [...existingTunes];
  for (let i = 0; i < givenCount && givenPool.length > 0; i++) {
    const idx = rng.intBetween(0, givenPool.length - 1);
    const target = givenPool.splice(idx, 1)[0]!;
    stars.push({
      id: starId++,
      userId: viewer.id,
      tuneId: target.id,
      createdAt: target.createdAt,
    });
  }

  return { tunes, stars };
}
