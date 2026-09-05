const db = require("../config/database");

async function createUser({
  email,
  googleId = null,
  authProvider = "email"
}) {
  const result = await db.query(
    `
      INSERT INTO users (
        email,
        google_id,
        auth_provider,
        is_verified
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        email,
        google_id,
        auth_provider,
        is_verified,
        created_at
    `,
    [
      email.toLowerCase().trim(),
      googleId,
      authProvider,
      false
    ]
  );

  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await db.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email.toLowerCase().trim()]
  );

  return result.rows[0] || null;
}

async function findUserByUserId(userId) {
  const result = await db.query(
    `
      SELECT *
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findUserByGoogleId(googleId) {
  const result = await db.query(
    `
      SELECT *
      FROM users
      WHERE google_id = $1
      LIMIT 1
    `,
    [googleId]
  );

  return result.rows[0] || null;
}

async function markUserVerified(userId) {
  const result = await db.query(
    `
      UPDATE users
      SET is_verified = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `,
    [userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserByUserId,
  findUserByGoogleId,
  markUserVerified
};