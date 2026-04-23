DROP INDEX IF EXISTS idx_users_forza_gamertag;

CREATE UNIQUE INDEX idx_users_forza_gamertag
  ON users(forza_gamertag)
  WHERE forza_gamertag IS NOT NULL;
