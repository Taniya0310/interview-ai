const db = require("../config/database");

module.exports = {
  list: async (filters = {}) => {
    const result = await db.query(
      `
      SELECT *
      FROM questions
      WHERE
        ($1::text IS NULL OR interview_type = $1)
        AND ($2::text IS NULL OR role = $2)
        AND ($3::text IS NULL OR difficulty = $3)
        AND (
          $4::boolean IS NULL
          OR is_active = $4
        )
      ORDER BY created_at DESC
      `,
      [
        filters.interviewType || null,
        filters.role || null,
        filters.difficulty || null,
        filters.isActive === undefined
          ? true
          : filters.isActive,
      ]
    );

    return result.rows;
  },

  create: async (data) => {
    const result = await db.query(
      `
      INSERT INTO questions (
        interview_type,
        role,
        difficulty,
        text,
        expected_topics,
        reference_answer,
        answer_key_points,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        data.interviewType,
        data.role,
        data.difficulty,
        data.text,
        JSON.stringify(data.expectedTopics || []),
        data.referenceAnswer || "",
        JSON.stringify(data.answerKeyPoints || []),
        data.isActive !== false,
      ]
    );

    return result.rows[0];
  },

  update: async (id, data) => {
    const result = await db.query(
      `
      UPDATE questions
      SET
        interview_type = COALESCE($1, interview_type),
        role = COALESCE($2, role),
        difficulty = COALESCE($3, difficulty),
        text = COALESCE($4, text),
        expected_topics = COALESCE($5, expected_topics),
        reference_answer = COALESCE(
          $6,
          reference_answer
        ),
        answer_key_points = COALESCE(
          $7,
          answer_key_points
        ),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [
        data.interviewType,
        data.role,
        data.difficulty,
        data.text,
        data.expectedTopics
          ? JSON.stringify(data.expectedTopics)
          : null,
        data.referenceAnswer,
        data.answerKeyPoints
          ? JSON.stringify(data.answerKeyPoints)
          : null,
        data.isActive,
        id,
      ]
    );

    return result.rows[0];
  },

  remove: async (id) => {
    await db.query(
      `
      UPDATE questions
      SET is_active = false
      WHERE id = $1
      `,
      [id]
    );
  },
};