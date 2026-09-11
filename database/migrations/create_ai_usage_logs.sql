CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  answer_id UUID,

  request_type VARCHAR(50) NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'gemini',
  model VARCHAR(100),

  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  estimated_cost NUMERIC(12, 6) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message TEXT,

  latency_ms INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_interview_idx
  ON ai_usage_logs(interview_id);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_idx
  ON ai_usage_logs(user_id);

CREATE INDEX IF NOT EXISTS ai_usage_logs_created_idx
  ON ai_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS ai_usage_logs_type_idx
  ON ai_usage_logs(request_type);