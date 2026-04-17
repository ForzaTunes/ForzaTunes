import type { Drivetrain, Tune, GameConfig } from "../models";
import { DEMO_USERS } from "./UserFixtures";
import { demoCarsForGame } from "./CarFixtures";
import { SeedRng, DEMO_SEED } from "./seedRng";
import gamesJson from "../../data/games.json";

const CONFIGS = gamesJson as GameConfig[];

const TITLES_BY_TYPE: Record<string, string[]> = {
  road: ["Balanced Road Build", "Touring Spec", "GT Weekend", "Long Corner King"],
  dirt: ["Rally Spec", "Gravel Shredder", "Dirt Devil", "Mudflap Monster"],
  cross_country: ["All-Terrain Beast", "XC Bruiser", "Hop the Hills"],
  street: ["Street Sleeper", "Boulevard Missile", "Midnight Run", "City Cruiser"],
  drag: ["Quarter Mile Killer", "Straight-Line Savage", "Launch Demon"],
  drift: ["Drift Ready", "Angle Abuser", "Tandem Tuned", "Smoke Signals"],
  touge: ["Touge Twitch", "Mountain Pass", "Downhill Dancer"],
  circuit: ["Circuit Setup", "Low-Tire-Wear Spec", "Qualy Lap"],
  sprint: ["Sprint Spec", "Push Lap", "Dash Tuned"],
  open: ["Open Practice Baseline", "Shakedown", "Reference Tune"],
};

const TITLE_PREFIXES = [
  "",
  "V2 ",
  "MkII ",
  "Tight ",
  "Loose ",
  "Balanced ",
  "Aggressive ",
  "Soft ",
];

const DESCRIPTIONS = [
  "Works best on controller but plays nice with a wheel.",
  "Diff locked up slightly for predictable power-on oversteer.",
  "Ride height dropped for better aero stability at high speed.",
  "Fuel lean and short gearing — ignore the mpg figure.",
  "Built around Goliath but holds up on any big loop.",
  "Stock suspension dampers tweaked for weight transfer on turn-in.",
  "Tire pressures are low on purpose; grip over heat.",
  "Swap to soft compound for cold starts if you feel understeer.",
  "Not a qualifier — this is a full-race endurance setup.",
  null,
];

const TRACKS_FH: (string | null)[] = [
  null,
  "Horizon Open A",
  "Horizon Open S1",
  "Goliath",
  "Marathon",
  "The Colossus",
  "EventLab Custom",
];

const TRACKS_FM: (string | null)[] = [
  null,
  "Maple Valley",
  "Nurburgring GP",
  "Road America",
  "Suzuka",
  "Laguna Seca",
  "Spa-Francorchamps",
];

const DRIVETRAINS: Drivetrain[] = ["FWD", "RWD", "AWD"];

const NOW = Date.now();
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function shareCode(rng: SeedRng, length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += rng.intBetween(0, 9).toString();
  }
  return out;
}

function pickTitle(rng: SeedRng, tuneType: string): string {
  const pool = TITLES_BY_TYPE[tuneType] ?? ["Tune"];
  const prefix = rng.pick(TITLE_PREFIXES);
  return `${prefix}${rng.pick(pool)}`.trim();
}

function pickDescription(rng: SeedRng): string | null {
  return rng.pick(DESCRIPTIONS);
}

function pickTrack(rng: SeedRng, gameSlug: string): string | null {
  const pool = gameSlug === "fm" ? TRACKS_FM : TRACKS_FH;
  return rng.pick(pool);
}

function countForClass(className: string): number {
  const hot = new Set(["A", "S1", "S", "B"]);
  const cold = new Set(["X", "R", "P", "E"]);
  if (hot.has(className)) return 14;
  if (cold.has(className)) return 6;
  return 10;
}

export function generateDemoTunes(): Tune[] {
  const rng = new SeedRng(DEMO_SEED);
  const tunes: Tune[] = [];
  let tuneId = 1;

  for (let gameIdx = 0; gameIdx < CONFIGS.length; gameIdx++) {
    const config = CONFIGS[gameIdx]!;
    const gameId = gameIdx + 1;
    const cars = demoCarsForGame(gameId);
    if (cars.length === 0) continue;

    for (const classRange of config.classRanges) {
      const count = countForClass(classRange.class);
      for (let i = 0; i < count; i++) {
        const car = rng.pick(cars);
        const user = rng.pick(DEMO_USERS);
        const tuneType = rng.pick(config.tuneTypes).value;
        const pi = rng.intBetween(classRange.min, classRange.max);
        const drivetrain = rng.chance(0.9) ? rng.pick(DRIVETRAINS) : null;
        const createdOffset = rng.next() * SIXTY_DAYS_MS;
        const createdAt = new Date(NOW - createdOffset).toISOString();

        tunes.push({
          id: tuneId++,
          gameId,
          shareCode: shareCode(rng, config.shareCodeLength),
          carId: car.id,
          title: pickTitle(rng, tuneType),
          description: pickDescription(rng),
          creatorGamertag: user.forza_gamertag ?? user.username,
          tuneType,
          piRating: pi,
          carClass: classRange.class,
          drivetrain,
          trackName: pickTrack(rng, config.slug),
          userId: user.id,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }
  }

  return tunes;
}
