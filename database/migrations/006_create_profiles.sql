CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(20) PRIMARY KEY
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    full_name VARCHAR(120),

    phone_number VARCHAR(30),

    institution_company VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);
