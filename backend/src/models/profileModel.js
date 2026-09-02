const db = require("../config/database");

async function findProfileByUserId(userId) {
  const result = await db.query(
    `
      SELECT
        user_id,
        full_name,
        phone_number,
        created_at,
        updated_at
      FROM profiles
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function createProfile(userId) {
  const result = await db.query(
    `
      INSERT INTO profiles (user_id)
      VALUES ($1)
      ON CONFLICT (user_id)
      DO NOTHING
      RETURNING
        user_id,
        full_name,
        phone_number,
        created_at,
        updated_at
    `,
    [userId]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  return findProfileByUserId(userId);
}

async function updateProfile(
  userId,
  fullName,
  phoneNumber
) {
  const result = await db.query(
    `
      INSERT INTO profiles (
        user_id,
        full_name,
        phone_number
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        user_id,
        full_name,
        phone_number,
        created_at,
        updated_at
    `,
    [
      userId,
      fullName || null,
      phoneNumber || null
    ]
  );

  return result.rows[0];
}

module.exports = {
  findProfileByUserId,
  createProfile,
  updateProfile
};