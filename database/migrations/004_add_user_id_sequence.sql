CREATE SEQUENCE IF NOT EXISTS user_id_number_seq;

DO $$
DECLARE
    highest_number BIGINT;
BEGIN
    SELECT COALESCE(
        MAX(
            NULLIF(
                regexp_replace(user_id, '^USR', ''),
                ''
            )::BIGINT
        ),
        0
    )
    INTO highest_number
    FROM users;

    PERFORM setval(
        'user_id_number_seq',
        highest_number + 1,
        false
    );
END $$;

ALTER TABLE users
ALTER COLUMN user_id SET DEFAULT (
    'USR' ||
    LPAD(
        nextval('user_id_number_seq')::TEXT,
        4,
        '0'
    )
);