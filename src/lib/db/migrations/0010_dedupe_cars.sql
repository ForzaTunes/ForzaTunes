-- Dedupe cars and add a UNIQUE index on (game_id, make, model, year).
--
-- Background: the original `cars` table had no uniqueness constraint on
-- (game_id, make, model, year). The seed script used `INSERT OR IGNORE`,
-- which had nothing to ignore on, so every re-seed inserted fresh duplicate
-- rows. Tunes were created against whichever duplicate happened to be
-- referenced at write time, so we must repoint them to a canonical row
-- (the MIN(id) per group) before deleting the duplicates.
--
-- Strategy: single-pass window function builds a mapping table, then
-- everything joins through that. Avoids per-tune correlated subqueries
-- that previously timed out on D1 remote.

PRAGMA defer_foreign_keys = true;

-- Defensive: if a previous failed run left this around, clean up.
DROP TABLE IF EXISTS _car_canonical_map;

-- 1. Build old_id -> canonical_id (MIN id per group) in a single pass
--    over cars using a window function.
CREATE TABLE _car_canonical_map (
  old_id INTEGER PRIMARY KEY,
  canonical_id INTEGER NOT NULL
);

INSERT INTO _car_canonical_map (old_id, canonical_id)
SELECT
  id,
  MIN(id) OVER (PARTITION BY game_id, make, model, year)
FROM cars;

-- 2. Repoint every tune to the canonical car_id via PK lookup on the map.
UPDATE tunes
SET car_id = (
  SELECT canonical_id FROM _car_canonical_map WHERE old_id = tunes.car_id
);

-- 3. Delete every non-canonical car row.
DELETE FROM cars WHERE id NOT IN (
  SELECT canonical_id FROM _car_canonical_map
);

DROP TABLE _car_canonical_map;

-- 4. Enforce uniqueness going forward. Equivalent to a UNIQUE table
--    constraint, and works with INSERT OR IGNORE in run-seed.ts.
CREATE UNIQUE INDEX idx_cars_unique_group ON cars(game_id, make, model, year);
