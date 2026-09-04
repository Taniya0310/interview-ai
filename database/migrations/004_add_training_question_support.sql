ALTER TABLE questions
ADD COLUMN IF NOT EXISTS category_id INTEGER
REFERENCES training_categories(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS questions_category_index
ON questions(category_id);