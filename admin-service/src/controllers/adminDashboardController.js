const pool = require("../config/database");

async function getAdminDashboard(req, res) {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE is_verified = TRUE) AS verified_users,
        (SELECT COUNT(*)::int FROM interviews) AS total_interviews,
        (SELECT COUNT(*)::int FROM interviews WHERE status = 'completed') AS completed_interviews,
        (SELECT COUNT(*)::int FROM questions WHERE is_active = TRUE) AS active_questions,
        (SELECT COUNT(*)::int FROM answers) AS total_answers,
        (SELECT COUNT(*)::int FROM analyses) AS total_analyses
    `);

    const users = await pool.query(`
      SELECT
        u.user_id,
        u.email,
        p.full_name,
        u.is_verified,
        u.created_at
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.user_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    const interviews = await pool.query(`
      SELECT
        id,
        user_id,
        interview_type,
        role,
        difficulty,
        status,
        created_at,
        completed_at
      FROM interviews
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      statistics: stats.rows[0],
      recentUsers: users.rows,
      recentInterviews: interviews.rows,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
}

module.exports = {
  getAdminDashboard,
};