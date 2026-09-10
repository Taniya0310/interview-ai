const pool = require("../config/database");

async function getUsers(req, res) {
  try {
    const result = await pool.query(`
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
    `);

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      message: "Failed to load users",
    });
  }
}

async function getUserById(req, res) {
  try {
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
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Admin user details error:", error);

    res.status(500).json({
      message: "Failed to load user",
    });
  }
}

module.exports = {
  getUsers,
  getUserById,
};