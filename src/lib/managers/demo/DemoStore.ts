import type { Report, Star, Tune } from "../../models";
import type { UserRow } from "../interfaces";
import { generateDemoTunes } from "../../fixtures/TuneFixtures";
import { generateDemoStars } from "../../fixtures/StarFixtures";
import { DEMO_USERS, DEMO_VIEWER_USER } from "../../fixtures/UserFixtures";
import { generateViewerContent } from "../../fixtures/ViewerContentFixtures";

export class DemoStore {
  tunes: Tune[];
  stars: Star[];
  users: UserRow[];
  reports: Report[];

  private nextTuneId: number;
  private nextStarId: number;
  private nextReportId: number;

  constructor() {
    const baseTunes = generateDemoTunes();
    const baseStars = generateDemoStars(baseTunes);

    const viewerContent = generateViewerContent(
      DEMO_VIEWER_USER,
      DEMO_USERS,
      baseTunes,
      maxId(baseTunes) + 1,
      maxId(baseStars) + 1,
    );

    this.tunes = [...viewerContent.tunes, ...baseTunes];
    this.stars = [...baseStars, ...viewerContent.stars];
    this.users = [DEMO_VIEWER_USER, ...DEMO_USERS];
    this.reports = [];
    this.nextTuneId = maxId(this.tunes) + 1;
    this.nextStarId = maxId(this.stars) + 1;
    this.nextReportId = 1;
  }

  allocateTuneId(): number {
    return this.nextTuneId++;
  }

  allocateStarId(): number {
    return this.nextStarId++;
  }

  allocateReportId(): number {
    return this.nextReportId++;
  }
}

function maxId(items: { id: number }[]): number {
  let max = 0;
  for (const item of items) {
    if (item.id > max) max = item.id;
  }
  return max;
}

let singleton: DemoStore | null = null;

export function getDemoStore(): DemoStore {
  if (!singleton) singleton = new DemoStore();
  return singleton;
}
