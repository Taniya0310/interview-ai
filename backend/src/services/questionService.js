const db = require("../config/database");

module.exports = {
  list: async (filters = {}) => {
    const result = await db.query(
      `
        SELECT
          questions.*,
          training_categories.name AS category_name
        FROM questions
        LEFT JOIN training_categories
          ON training_categories.id =
             questions.category_id
        WHERE
          ($1::text IS NULL
            OR questions.interview_type = $1)
          AND ($2::text IS NULL
            OR questions.role = $2)
          AND ($3::text IS NULL
            OR questions.difficulty = $3)
          AND (
            $4::boolean IS NULL
            OR questions.is_active = $4
          )
          AND (
            $5::integer IS NULL
            OR questions.category_id = $5
          )
        ORDER BY questions.created_at DESC
      `,
      [
        filters.interviewType || null,
        filters.role || null,
        filters.difficulty || null,
        filters.isActive === undefined
          ? true
          : filters.isActive,
        filters.categoryId || null
      ]
    );

    return result.rows;
  },

  listTraining: async (
    categoryId,
    limit = 5
  ) => {
    const result = await db.query(
      `
        SELECT
          id,
          interview_type,
          role,
          difficulty,
          text,
          expected_topics,
          reference_answer,
          answer_key_points,
          category_id
        FROM questions
        WHERE interview_type = 'training'
          AND is_active = TRUE
          AND category_id = $1
        ORDER BY RANDOM()
        LIMIT $2
      `,
      [categoryId, limit]
    );

    return result.rows;
  },
findById: async (id) => {
  const result = await db.query(
    `
      SELECT
        id,
        interview_type,
        role,
        difficulty,
        text,
        expected_topics,
        reference_answer,
        answer_key_points,
        category_id,
        is_active
      FROM questions
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
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
          category_id,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        data.interviewType,
        data.role,
        data.difficulty,
        data.text,
        JSON.stringify(
          data.expectedTopics || []
        ),
        data.referenceAnswer || "",
        JSON.stringify(
          data.answerKeyPoints || []
        ),
        data.categoryId || null,
        data.isActive !== false
      ]
    );

    return result.rows[0];
  },

  update: async (id, data) => {
    const result = await db.query(
      `
        UPDATE questions
        SET
          interview_type =
            COALESCE($1, interview_type),
          role =
            COALESCE($2, role),
          difficulty =
            COALESCE($3, difficulty),
          text =
            COALESCE($4, text),
          expected_topics =
            COALESCE($5, expected_topics),
          reference_answer =
            COALESCE($6, reference_answer),
          answer_key_points =
            COALESCE($7, answer_key_points),
          category_id =
            COALESCE($8, category_id),
          is_active =
            COALESCE($9, is_active),
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `,
      [
        data.interviewType,
        data.role,
        data.difficulty,
        data.text,
        data.expectedTopics
          ? JSON.stringify(
              data.expectedTopics
            )
          : null,
        data.referenceAnswer,
        data.answerKeyPoints
          ? JSON.stringify(
              data.answerKeyPoints
            )
          : null,
        data.categoryId || null,
        data.isActive,
        id
      ]
    );

    return result.rows[0];
  },

  remove: async (id) => {
    await db.query(
      `
        UPDATE questions
        SET
          is_active = FALSE,
          updated_at = NOW()
        WHERE id = $1
      `,
      [id]
    );
  }
};