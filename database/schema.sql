-- Interview AI database schema.
-- Run against an empty PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_type TEXT NOT NULL,
    role TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    text TEXT NOT NULL,
    expected_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT questions_text_not_empty CHECK (length(trim(text)) > 0),
    CONSTRAINT questions_expected_topics_array CHECK (jsonb_typeof(expected_topics) = 'array')
);

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_type TEXT NOT NULL,
    role TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT interviews_status_check CHECK (status IN ('in_progress', 'processing', 'completed', 'failed', 'cancelled', 'quit'))
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    position INTEGER NOT NULL CHECK (position > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    follow_up_count INTEGER NOT NULL DEFAULT 0,
    is_satisfied BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (interview_id, position),
    UNIQUE (interview_id, question_id)
);

CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    interview_question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    video_path TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'video/webm',
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    is_follow_up BOOLEAN NOT NULL DEFAULT FALSE,
    parent_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT answers_status_check CHECK (status IN ('pending', 'processing', 'analyzed', 'failed'))
);

CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL UNIQUE REFERENCES answers(id) ON DELETE CASCADE,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT analyses_status_check CHECK (status IN ('pending', 'complete', 'failed')),
    CONSTRAINT analyses_result_object_check CHECK (jsonb_typeof(result) = 'object')
);

CREATE INDEX IF NOT EXISTS questions_matching_index ON questions (interview_type, role, difficulty, is_active);
CREATE INDEX IF NOT EXISTS interviews_status_index ON interviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS interview_questions_interview_index ON interview_questions (interview_id, position);
CREATE INDEX IF NOT EXISTS answers_interview_index ON answers (interview_id, created_at);
CREATE INDEX IF NOT EXISTS answers_status_index ON answers (status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS questions_set_updated_at ON questions;
CREATE TRIGGER questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
