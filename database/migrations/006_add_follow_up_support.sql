-- Adds adaptive follow-up interview support to an existing database.

ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS follow_up_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS is_satisfied BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE answers
    ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE answers
    ADD COLUMN IF NOT EXISTS parent_answer_id UUID
    REFERENCES answers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS answers_question_index
    ON answers (interview_question_id, created_at);
