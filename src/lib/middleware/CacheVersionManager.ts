export interface ICacheVersionManager {
  getVersion(): Promise<string>;
  bump(): Promise<void>;
}

/**
 * Stores a single global cache-version counter in KV. Bumping the version
 * invalidates every cached page globally (since cache keys include the
 * version). Reads are memoized per instance so a single Worker invocation
 * only hits KV once.
 */
export class CacheVersionManager implements ICacheVersionManager {
  private static readonly KEY = "cache:version:v1";
  private static readonly DEFAULT_VERSION = "1";
  private memoized: string | null = null;

  constructor(private readonly kv: KVNamespace) {}

  async getVersion(): Promise<string> {
    if (this.memoized !== null) return this.memoized;
    const fromKv = await this.kv.get(CacheVersionManager.KEY);
    const resolved = fromKv ?? CacheVersionManager.DEFAULT_VERSION;
    this.memoized = resolved;
    return resolved;
  }

  async bump(): Promise<void> {
    const next = Date.now().toString();
    this.memoized = next;
    try {
      await this.kv.put(CacheVersionManager.KEY, next);
    } catch (err) {
      console.warn("[CacheVersionManager] Failed to persist bump:", err);
    }
  }
}
