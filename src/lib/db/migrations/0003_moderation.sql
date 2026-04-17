ALTER TABLE users ADD COLUMN banned_at TEXT;
ALTER TABLE users ADD COLUMN ban_reason TEXT;

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tune_id INTEGER NOT NULL,
  reporter_user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tune_id) REFERENCES tunes(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (tune_id, reporter_user_id)
);

CREATE INDEX idx_reports_tune ON reports(tune_id);
CREATE INDEX idx_reports_status ON reports(status);
