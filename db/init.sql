
-- Paleisk šį skriptą Neon konsolėje
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  input_json JSONB NOT NULL,
  plan_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
