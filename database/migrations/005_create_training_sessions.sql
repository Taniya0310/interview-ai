CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id VARCHAR(100) NOT NULL,

  category_id INTEGER
    REFERENCES training_categories(id)
    ON DELETE SET NULL,

  difficulty TEXT,

  total_questions INTEGER NOT NULL DEFAULT 0,

  completed_questions INTEGER NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (
      status IN (
        'in_progress',
        'completed',
        'abandoned'
      )
    ),

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS training_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  training_session_id UUID NOT NULL
    REFERENCES training_sessions(id)
    ON DELETE CASCADE,

  question_id UUID NOT NULL
    REFERENCES questions(id)
    ON DELETE RESTRICT,

  answer_text TEXT,

  audio_path TEXT,

  audio_mime_type TEXT,

  duration_seconds NUMERIC(10, 2),

  score NUMERIC(5, 2),

  feedback TEXT,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'processing',
        'completed',
        'failed'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (
    training_session_id,
    question_id
  )
);

CREATE INDEX IF NOT EXISTS training_sessions_user_index
ON training_sessions(user_id);

CREATE INDEX IF NOT EXISTS training_answers_session_index
ON training_answers(training_session_id);

CREATE INDEX IF NOT EXISTS training_answers_question_index
ON training_answers(question_id);

ALTER TABLE training_answers
ADD COLUMN IF NOT EXISTS analysis JSONB;