const pool = require("../config/database");

async function listInterviews({
  page = 1,
  limit = 10,
} = {}) {
  const offset = (page - 1) * limit;

  const countResult = await pool.query(`
    SELECT COUNT(*)::INTEGER AS total
    FROM interviews
  `);

  const result = await pool.query(
    `
    SELECT
      i.id,
      i.user_id,
      i.interview_type,
      i.role,
      i.difficulty,
      i.status,
      i.created_at,
      i.completed_at
    FROM interviews i
    ORDER BY i.created_at DESC
    LIMIT $1
    OFFSET $2
    `,
    [limit, offset],
  );

  const total = countResult.rows[0].total;

  return {
    interviews: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function findInterviewById(id) {
  const result = await pool.query(
    `
    SELECT
      i.id,
      i.user_id,
      i.interview_type,
      i.role,
      i.difficulty,
      i.status,
      i.created_at,
      i.completed_at,

      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'interview_question_id', iq.id,
              'question_id', q.id,
              'position', iq.position,
              'question_text', q.text,
              'expected_topics', q.expected_topics,
              'follow_up_count', iq.follow_up_count,
              'is_satisfied', iq.is_satisfied,

              'answers',
              COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'answer_id', a.id,
                      'video_path', a.video_path,
                      'mime_type', a.mime_type,
                      'status', a.status,
                      'error_message', a.error_message,
                      'is_follow_up', a.is_follow_up,
                      'parent_answer_id', a.parent_answer_id,
                      'created_at', a.created_at,

                      'analysis',
                      CASE
                        WHEN an.id IS NULL THEN NULL
                        ELSE jsonb_build_object(
                          'analysis_id', an.id,
                          'result', an.result,
                          'status', an.status,
                          'completed_at',
                            an.completed_at,
                          'created_at',
                            an.created_at
                        )
                      END
                    )
                    ORDER BY a.created_at
                  )
                  FROM answers a
                  LEFT JOIN analyses an
                    ON an.answer_id = a.id
                  WHERE a.interview_question_id = iq.id
                ),
                '[]'::jsonb
              )
            )
            ORDER BY iq.position
          )
          FROM interview_questions iq
          INNER JOIN questions q
            ON q.id = iq.question_id
          WHERE iq.interview_id = i.id
        ),
        '[]'::jsonb
      ) AS questions

    FROM interviews i
    WHERE i.id = $1
    LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

module.exports = {
  listInterviews,
  findInterviewById,
};