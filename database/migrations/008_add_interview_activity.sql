ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS interviews_last_seen_at_index
ON interviews(last_seen_at);