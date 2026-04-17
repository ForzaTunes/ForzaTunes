ALTER TABLE users ADD COLUMN forza_gamertag TEXT;

CREATE INDEX idx_users_forza_gamertag ON users(forza_gamertag);
