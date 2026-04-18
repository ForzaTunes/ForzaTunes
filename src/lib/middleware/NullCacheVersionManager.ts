import type { ICacheVersionManager } from "./CacheVersionManager";

/**
 * No-op implementation used when KV is unavailable (e.g. demo mode or local
 * dev without bindings). Always returns a fixed version and silently ignores
 * bump calls. Callers that construct cache keys with this version will still
 * generate consistent keys within a single process, but the edge cache will
 * simply never be populated in an environment that skips caching upstream.
 */
export class NullCacheVersionManager implements ICacheVersionManager {
  async getVersion(): Promise<string> {
    return "null";
  }

  async bump(): Promise<void> {}
}
