CREATE TABLE IF NOT EXISTS otp_codes (
    id BIGSERIAL PRIMARY KEY,

    email VARCHAR(255) NOT NULL,

    otp_hash VARCHAR(128) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS otp_codes_email_index
    ON otp_codes (email);

CREATE INDEX IF NOT EXISTS otp_codes_expiry_index
    ON otp_codes (expires_at);