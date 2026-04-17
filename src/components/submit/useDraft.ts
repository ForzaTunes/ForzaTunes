import { useEffect, useRef } from "react";

/**
 * Persists form state to localStorage so that a user's in-progress
 * submission survives accidental tab refreshes.
 *
 * Call `clear()` on successful submit.
 */
export function useDraft<T extends object>(
  key: string,
  state: T,
  restore: (snapshot: Partial<T>) => void,
): { clear: () => void } {
  const hasRestored = useRef(false);
  const cleared = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as Partial<T>;
      restore(snapshot);
    } catch {
      // ignore malformed drafts
    }
  }, [key, restore]);

  useEffect(() => {
    if (!hasRestored.current) return;
    // Once the caller has explicitly cleared the draft (e.g. on successful
    // submit), swallow any subsequent saves that would re-populate storage
    // from residual React state before the page actually navigates.
    if (cleared.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // quota or storage disabled — non-critical
    }
  }, [key, state]);

  function clear() {
    cleared.current = true;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  return { clear };
}
