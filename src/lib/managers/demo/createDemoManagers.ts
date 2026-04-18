import type { Managers } from "../../ManagerFactory";
import { NullCacheVersionManager } from "../../middleware/NullCacheVersionManager";
import { DemoCarManager } from "./DemoCarManager";
import { DemoGameManager } from "./DemoGameManager";
import { DemoReportManager } from "./DemoReportManager";
import { DemoStarManager } from "./DemoStarManager";
import { DemoTuneManager } from "./DemoTuneManager";
import { DemoUserManager } from "./DemoUserManager";
import { getDemoStore } from "./DemoStore";

export function createDemoManagers(): Managers {
  const store = getDemoStore();
  return {
    games: new DemoGameManager(),
    cars: new DemoCarManager(),
    tunes: new DemoTuneManager(store),
    stars: new DemoStarManager(store),
    users: new DemoUserManager(store),
    reports: new DemoReportManager(store),
    cacheVersions: new NullCacheVersionManager(),
  };
}
