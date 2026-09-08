const db = require("../config/database");

async function findProfileByUserId(userId) {
  const result = await db.query(
    `
      SELECT
        user_id,
        full_name,
        phone_number,
        occupation,
        domain,
        institution_company,
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
        occupation,
        domain,
        institution_company,
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
  phoneNumber,
  occupation,
  domain,
  institutionCompany
) {
  const result = await db.query(
    `
      INSERT INTO profiles (
        user_id,
        full_name,
        phone_number,
        occupation,
        domain,
        institution_company
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        occupation = EXCLUDED.occupation,
        domain = EXCLUDED.domain,
        institution_company = EXCLUDED.institution_company,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        user_id,
        full_name,
        phone_number,
        occupation,
        domain,
        institution_company,
        created_at,
        updated_at
    `,
    [
      userId,
      fullName || null,
      phoneNumber || null,
      occupation || null,
      domain || null,
      institutionCompany || null
    ]
  );

  return result.rows[0];
}

module.exports = {
  findProfileByUserId,
  createProfile,
  updateProfile
};