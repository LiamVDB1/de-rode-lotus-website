-- Vertaalgeheugen: per taal één vertaling per Nederlandse tekst (sleutel = hash van die tekst).
-- origin 'auto' = automatisch vertaald, 'manual' = verbeterd in het beheer.
CREATE TABLE translations (
  lang TEXT NOT NULL CHECK (lang IN ('en', 'fr')),
  hash TEXT NOT NULL,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('auto', 'manual')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (lang, hash)
);
