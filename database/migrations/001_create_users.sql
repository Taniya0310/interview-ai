CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    user_id VARCHAR(20) NOT NULL UNIQUE,

    email VARCHAR(255) NOT NULL UNIQUE,

    google_id VARCHAR(255) UNIQUE,

    auth_provider VARCHAR(20) NOT NULL DEFAULT 'email',

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS users_email_index
    ON users (email);

CREATE INDEX IF NOT EXISTS users_google_id_index
    ON users (google_id);