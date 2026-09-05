ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS user_id VARCHAR(20);

ALTER TABLE interviews
ADD CONSTRAINT interviews_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(user_id)
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS interviews_user_id_index
ON interviews(user_id);