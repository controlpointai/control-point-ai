CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  concern TEXT NOT NULL DEFAULT '',
  workflow TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS inquiries_submitted_at
  ON inquiries (submitted_at DESC);

CREATE INDEX IF NOT EXISTS inquiries_email_submitted_at
  ON inquiries (email, submitted_at DESC);
