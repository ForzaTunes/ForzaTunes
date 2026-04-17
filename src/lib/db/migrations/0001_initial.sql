PRAGMA defer_foreign_keys = true;

CREATE TABLE games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  share_code_length INTEGER NOT NULL DEFAULT 9,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE auth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_username TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (provider, provider_id)
);

CREATE TABLE tunes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  share_code TEXT NOT NULL,
  car_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  creator_gamertag TEXT NOT NULL,
  tune_type TEXT NOT NULL,
  pi_rating INTEGER NOT NULL,
  car_class TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (game_id, share_code)
);

CREATE TABLE stars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tune_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tune_id) REFERENCES tunes(id) ON DELETE CASCADE,
  UNIQUE (user_id, tune_id)
);

CREATE INDEX idx_cars_game ON cars(game_id);
CREATE INDEX idx_cars_make ON cars(game_id, make);

CREATE INDEX idx_tunes_game ON tunes(game_id);
CREATE INDEX idx_tunes_car ON tunes(car_id);
CREATE INDEX idx_tunes_user ON tunes(user_id);
CREATE INDEX idx_tunes_type ON tunes(game_id, tune_type);
CREATE INDEX idx_tunes_class ON tunes(game_id, car_class);
CREATE INDEX idx_tunes_created ON tunes(game_id, created_at DESC);

CREATE INDEX idx_auth_user ON auth_accounts(user_id);

CREATE INDEX idx_stars_tune ON stars(tune_id);
CREATE INDEX idx_stars_user ON stars(user_id);
