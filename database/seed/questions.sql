-- Question bank seed data.
-- Each statement inserts one question and skips duplicates.

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'technical', 'backend-developer', 'beginner',
       'What is a REST API, and how would you design an endpoint for creating a user?',
       '["HTTP methods", "resource naming", "request validation", "status codes"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'technical'
      AND role = 'backend-developer'
      AND difficulty = 'beginner'
      AND text = 'What is a REST API, and how would you design an endpoint for creating a user?'
);

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'technical', 'backend-developer', 'beginner',
       'What is the difference between authentication and authorization?',
       '["identity", "permissions", "sessions", "access control"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'technical'
      AND role = 'backend-developer'
      AND difficulty = 'beginner'
      AND text = 'What is the difference between authentication and authorization?'
);

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'technical', 'backend-developer', 'beginner',
       'What is a database index and when would you use one?',
       '["query performance", "lookup", "write cost", "selectivity"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'technical'
      AND role = 'backend-developer'
      AND difficulty = 'beginner'
      AND text = 'What is a database index and when would you use one?'
);

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'technical', 'backend-developer', 'intermediate',
       'Explain database transactions and describe a situation where you would use one.',
       '["atomicity", "commit", "rollback", "consistency"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'technical'
      AND role = 'backend-developer'
      AND difficulty = 'intermediate'
      AND text = 'Explain database transactions and describe a situation where you would use one.'
);

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'technical', 'backend-developer', 'advanced',
       'How would you design a reliable background job system for processing uploaded videos?',
       '["queues", "retries", "idempotency", "dead-letter handling", "observability"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'technical'
      AND role = 'backend-developer'
      AND difficulty = 'advanced'
      AND text = 'How would you design a reliable background job system for processing uploaded videos?'
);

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'behavioral', 'software-engineer', 'beginner',
       'Tell me about a time you solved a difficult engineering problem.',
       '["context", "actions", "tradeoffs", "result", "learning"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'behavioral'
      AND role = 'software-engineer'
      AND difficulty = 'beginner'
      AND text = 'Tell me about a time you solved a difficult engineering problem.'
);

INSERT INTO questions (interview_type, role, difficulty, text, expected_topics)
SELECT 'behavioral', 'software-engineer', 'intermediate',
       'Describe a disagreement with a teammate and how you resolved it.',
       '["communication", "listening", "decision making", "outcome"]'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM questions
    WHERE interview_type = 'behavioral'
      AND role = 'software-engineer'
      AND difficulty = 'intermediate'
      AND text = 'Describe a disagreement with a teammate and how you resolved it.'
);
