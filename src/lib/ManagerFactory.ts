import { DatabaseClient } from "./db/DatabaseClient";
import { CarManager } from "./managers/CarManager";
import { GameManager } from "./managers/GameManager";
import { ReportManager } from "./managers/ReportManager";
import { StarManager } from "./managers/StarManager";
import { TuneManager } from "./managers/TuneManager";
import { UserManager } from "./managers/UserManager";
import { createDemoManagers } from "./managers/demo/createDemoManagers";
import { CacheVersionManager } from "./middleware/CacheVersionManager";
import type { ICacheVersionManager } from "./middleware/CacheVersionManager";
import { NullCacheVersionManager } from "./middleware/NullCacheVersionManager";
import type {
  ICarManager,
  IGameManager,
  IReportManager,
  IStarManager,
  ITuneManager,
  IUserManager,
} from "./managers/interfaces";

export interface Managers {
  games: IGameManager;
  cars: ICarManager;
  tunes: ITuneManager;
  stars: IStarManager;
  users: IUserManager;
  reports: IReportManager;
  cacheVersions: ICacheVersionManager;
}

export function createManagers(cfEnv: Cloudflare.Env): Managers {
  if (cfEnv.DEMO_MODE === "true") {
    return createDemoManagers();
  }
  return createD1Managers(cfEnv);
}

function createD1Managers(cfEnv: Cloudflare.Env): Managers {
  const db = new DatabaseClient(cfEnv.DB);
  const cacheVersions = cfEnv.SESSION
    ? new CacheVersionManager(cfEnv.SESSION)
    : new NullCacheVersionManager();
  return {
    games: new GameManager(db),
    cars: new CarManager(db),
    tunes: new TuneManager(db, cacheVersions),
    stars: new StarManager(db, cacheVersions),
    users: new UserManager(db),
    reports: new ReportManager(db),
    cacheVersions,
  };
}
