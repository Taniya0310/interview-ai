const pool = require("../config/database");

async function listUsers({
  page = 1,
  limit = 10,
} = {}) {
  const offset = (page - 1) * limit;

  const countResult = await pool.query(`
    SELECT COUNT(*)::INTEGER AS total
    FROM users
  `);

  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.email,
      u.is_verified,
      u.created_at,
      u.updated_at,

      p.full_name,
      p.phone_number,
      p.occupation,
      p.domain,
      p.institution_company,
      p.created_at AS profile_created_at,
      p.updated_at AS profile_updated_at

    FROM users u
    LEFT JOIN profiles p
      ON p.user_id = u.user_id
    ORDER BY u.created_at DESC
    LIMIT $1
    OFFSET $2
    `,
    [limit, offset],
  );

  const total = countResult.rows[0].total;

  return {
    users: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getUserById(id) {
  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.email,
      u.is_verified,
      u.created_at,
      u.updated_at,

      p.full_name,
      p.phone_number,
      p.occupation,
      p.domain,
      p.institution_company,
      p.created_at AS profile_created_at,
      p.updated_at AS profile_updated_at

    FROM users u
    LEFT JOIN profiles p
      ON p.user_id = u.user_id
    WHERE u.user_id = $1
    LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

module.exports = {
  listUsers,
  getUserById,
};