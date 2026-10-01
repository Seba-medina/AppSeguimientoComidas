CREATE TABLE IF NOT EXISTS comidas (
  key text PRIMARY KEY,
  data bytea NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
