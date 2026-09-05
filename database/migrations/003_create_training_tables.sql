CREATE TABLE IF NOT EXISTS training_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO training_categories (
  name,
  description
)
VALUES
  (
    'General Interview',
    'Common interview questions'
  ),
  (
    'Technical',
    'Technical interview practice'
  ),
  (
    'HR',
    'Human resources interview practice'
  ),
  (
    'Behavioral',
    'Behavioral interview questions'
  )
ON CONFLICT (name) DO NOTHING;