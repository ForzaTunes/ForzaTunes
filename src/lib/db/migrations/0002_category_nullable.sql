-- Make category nullable for scraped cars without category data.
-- SQLite doesn't support ALTER COLUMN, so we recreate the table.

PRAGMA defer_foreign_keys = true;

CREATE TABLE cars_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT,
  image_url TEXT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

INSERT INTO cars_new (id, game_id, make, model, year, category)
  SELECT id, game_id, make, model, year, category FROM cars;

DROP TABLE cars;
ALTER TABLE cars_new RENAME TO cars;

CREATE INDEX idx_cars_game ON cars(game_id);
CREATE INDEX idx_cars_make ON cars(game_id, make);
