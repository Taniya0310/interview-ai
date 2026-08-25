ALTER TABLE questions
ADD COLUMN IF NOT EXISTS reference_answer TEXT;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS answer_key_points JSONB
DEFAULT '[]'::jsonb;

INSERT INTO questions (
  interview_type,
  role,
  difficulty,
  text,
  expected_topics,
  reference_answer,
  answer_key_points,
  is_active
)
VALUES (
  'non-technical',
  'general',
  'beginner',
  'Please introduce yourself and tell us about your background, experience, and career goals.',
  '["Introduction", "Background", "Experience", "Career goals"]'::jsonb,
  'The candidate should explain their background, education or experience, relevant skills, career interests, and future goals in a clear and structured way.',
  '["Self-introduction", "Background", "Experience or education", "Relevant skills", "Career goals"]'::jsonb,
  true
);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';

ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';