import type { GameConfig } from "../models";

const DAY_MS = 86_400_000;

export class GameReleaseStatus {
  constructor(private readonly now: () => number = Date.now) {}

  isPreLaunch(config: Pick<GameConfig, "playableFromUtc">): boolean {
    const ms = this.msUntilPlayable(config);
    return ms !== null && ms > 0;
  }

  msUntilPlayable(
    config: Pick<GameConfig, "playableFromUtc">,
  ): number | null {
    if (!config.playableFromUtc) return null;
    const target = Date.parse(config.playableFromUtc);
    if (Number.isNaN(target)) return null;
    return target - this.now();
  }

  daysUntilPlayable(
    config: Pick<GameConfig, "playableFromUtc">,
  ): number | null {
    const ms = this.msUntilPlayable(config);
    if (ms === null) return null;
    return Math.max(0, Math.ceil(ms / DAY_MS));
  }
}
