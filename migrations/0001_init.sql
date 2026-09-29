-- Inhoud: per document een werkversie (draft) en een gepubliceerde versie, beide als JSON.
CREATE TABLE documents (
  key TEXT PRIMARY KEY,
  draft TEXT NOT NULL,
  published TEXT,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

-- Foto's in R2; hier staan de gegevens die de beheerder ziet.
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  alt TEXT NOT NULL DEFAULT '',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  bytes INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Aanmeldingen van kandidaat-vrijwilligers.
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'gelezen', 'afgehandeld'))
);
CREATE INDEX submissions_created ON submissions (created_at DESC);

-- Tellers voor rate limiting (login, formulier). Bevat enkel gehashte IP-adressen.
CREATE TABLE rate_events (
  bucket TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX rate_events_bucket ON rate_events (bucket, at);
