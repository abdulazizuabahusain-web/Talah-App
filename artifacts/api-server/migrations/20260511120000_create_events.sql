CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_name_date ON events(event_name, created_at);
CREATE INDEX IF NOT EXISTS idx_groups_city ON groups(city);
