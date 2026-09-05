const db = require("../config/database");

async function saveRefreshToken(
  userId,
  tokenHash,
  expiresAt
) {
  const result = await db.query(
    `
      INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at
    `,
    [userId, tokenHash, expiresAt]
  );

  return result.rows[0];
}

async function findValidToken(tokenHash) {
  const result = await db.query(
    `
      SELECT *
      FROM refresh_tokens
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

async function revokeToken(tokenHash) {
  await db.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token_hash = $1
    `,
    [tokenHash]
  );
}

module.exports = {
  saveRefreshToken,
  findValidToken,
  revokeToken
};