CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,

  admin_id INTEGER NULL,

  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NULL,

  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  ip_address VARCHAR(100) NULL,
  user_agent TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id
  ON admin_audit_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON admin_audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity
  ON admin_audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON admin_audit_logs(created_at DESC);

  ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS provider VARCHAR(50)
  DEFAULT 'gemini';

ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;

ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER NULL;

ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS error_message TEXT NULL;