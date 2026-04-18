ALTER TABLE users ADD COLUMN public_slug TEXT;

UPDATE users
  SET public_slug = lower(hex(randomblob(6)))
  WHERE public_slug IS NULL;

CREATE UNIQUE INDEX idx_users_public_slug ON users(public_slug);
