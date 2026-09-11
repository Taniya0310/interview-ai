CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  value_type VARCHAR(20) NOT NULL DEFAULT 'number',
  description TEXT,
  updated_by VARCHAR(100),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (
  setting_key,
  setting_value,
  value_type,
  description
)
VALUES
(
  'minimum_passing_score',
  '60',
  'number',
  'Minimum score required to pass'
),
(
  'follow_up_question_limit',
  '2',
  'number',
  'Maximum follow-up questions per session'
),
(
  'speech_speed',
  '1.0',
  'number',
  'Piper speech speed'
),
(
  'speech_pitch',
  '1.0',
  'number',
  'Piper speech pitch'
),
(
  'speech_volume',
  '1.0',
  'number',
  'Piper speech volume'
),
(
  'tts_chunk_size',
  '180',
  'number',
  'Maximum TTS chunk size'
),
(
  'silence_timeout_ms',
  '3000',
  'number',
  'Silence duration before auto-submit'
),
(
  'interview_duration_minutes',
  '30',
  'number',
  'Maximum interview duration'
)
ON CONFLICT (setting_key) DO NOTHING;