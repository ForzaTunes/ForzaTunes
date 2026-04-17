-- Optional free-text track/event name.
-- Useful for FM circuit tunes and Horizon event-specific builds.

ALTER TABLE tunes ADD COLUMN track_name TEXT;
