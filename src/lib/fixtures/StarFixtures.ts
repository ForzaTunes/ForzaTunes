import type { Tune, Star } from "../models";
import { DEMO_USERS } from "./UserFixtures";
import { SeedRng, DEMO_SEED } from "./seedRng";

const STAR_BASE_SEED = DEMO_SEED ^ 0x51a2b3c4;

export function generateDemoStars(tunes: Tune[]): Star[] {
  const rng = new SeedRng(STAR_BASE_SEED);
  const stars: Star[] = [];
  let id = 1;

  for (const tune of tunes) {
    const hot = rng.chance(0.12);
    const maxStars = hot ? 40 : 8;
    const count = rng.intBetween(0, maxStars);
    const userPool = [...DEMO_USERS];

    for (let i = 0; i < count; i++) {
      if (userPool.length === 0) break;
      const idx = rng.intBetween(0, userPool.length - 1);
      const user = userPool.splice(idx, 1)[0]!;
      stars.push({
        id: id++,
        userId: user.id,
        tuneId: tune.id,
        createdAt: tune.createdAt,
      });
    }
  }

  return stars;
}
