-- Drivetrain is a first-class tune attribute (FWD/RWD/AWD).
-- Nullable so existing rows remain valid.

ALTER TABLE tunes ADD COLUMN drivetrain TEXT
  CHECK (drivetrain IS NULL OR drivetrain IN ('FWD', 'RWD', 'AWD'));

CREATE INDEX idx_tunes_drivetrain ON tunes(game_id, drivetrain);
