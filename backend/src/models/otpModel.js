const db = require("../config/database");

async function saveOtp(email, otpHash, expiresAt) {
  const result = await db.query(
    `
      INSERT INTO otp_codes (
        email,
        otp_hash,
        expires_at,
        attempts
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, expires_at
    `,
    [
      email.toLowerCase().trim(),
      otpHash,
      expiresAt,
      0
    ]
  );

  return result.rows[0];
}

async function findValidOtp(email) {
  const result = await db.query(
    `
      SELECT *
      FROM otp_codes
      WHERE email = $1
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [email.toLowerCase().trim()]
  );

  return result.rows[0] || null;
}

async function incrementAttempts(id) {
  await db.query(
    `
      UPDATE otp_codes
      SET attempts = attempts + 1
      WHERE id = $1
    `,
    [id]
  );
}

async function deleteOtp(id) {
  await db.query(
    `
      DELETE FROM otp_codes
      WHERE id = $1
    `,
    [id]
  );
}

module.exports = {
  saveOtp,
  findValidOtp,
  incrementAttempts,
  deleteOtp
};