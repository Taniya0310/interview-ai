ALTER TABLE interviews
DROP CONSTRAINT IF EXISTS interviews_status_check;

ALTER TABLE interviews
ADD CONSTRAINT interviews_status_check
CHECK (status IN ('in_progress', 'processing', 'completed', 'failed', 'cancelled', 'quit'));
