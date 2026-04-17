/**
 * Deterministic seeded PRNG for demo fixtures.
 *
 * Based on mulberry32 — small, fast, and sufficiently uniform for
 * picking fake data. NOT cryptographically secure; never use for
 * anything touching sessions or keys.
 */
export class SeedRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(minInclusive: number, maxInclusive: number): number {
    const span = maxInclusive - minInclusive + 1;
    return minInclusive + Math.floor(this.next() * span);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("SeedRng.pick called with empty array");
    }
    return items[this.intBetween(0, items.length - 1)]!;
  }

  pickWithChance<T>(items: readonly T[], chance: number): T | null {
    return this.next() < chance ? this.pick(items) : null;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

export const DEMO_SEED = 0xf0aa70;
