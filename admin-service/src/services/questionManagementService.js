const { parse } = require("csv-parse/sync");
const pool = require("../config/database");

async function listQuestions() {
  const result = await pool.query(`
    SELECT
      q.*,
      tc.name AS category_name
    FROM questions q
    LEFT JOIN training_categories tc
      ON tc.id = q.category_id
    ORDER BY q.created_at DESC
  `);

  return result.rows;
}

async function createQuestion(data) {
  const result = await pool.query(
    `
    INSERT INTO questions (
      interview_type,
      role,
      domain,
      difficulty,
      text,
      expected_topics,
      reference_answer,
      answer_key_points,
      category_id,
      is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
    RETURNING *
    `,
    [
      data.interviewType,
      data.role,
      data.domain || null,
      data.difficulty,
      data.text,
      JSON.stringify(data.expectedTopics || []),
      data.referenceAnswer || "",
      JSON.stringify(data.answerKeyPoints || []),
      data.categoryId || null,
    ]
  );

  return result.rows[0];
}

async function bulkUploadQuestions({
  fileBuffer,
  interviewType,
  difficulty,
  role,
  domainId,
  categoryId,
}) {
  const rows = parse(fileBuffer.toString("utf8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (rows.length === 0) {
    const error = new Error("CSV file is empty");
    error.statusCode = 400;
    throw error;
  }

  const requiredColumns = [
    "question",
    "expected_topics",
    "reference_answer",
    "answer_keypoints",
  ];

  const csvColumns = Object.keys(rows[0]);

  for (const column of requiredColumns) {
    if (!csvColumns.includes(column)) {
      const error = new Error(
        `Missing required CSV column: ${column}`
      );

      error.statusCode = 400;
      throw error;
    }
  }

  if (!interviewType) {
    const error = new Error("Interview type is required");
    error.statusCode = 400;
    throw error;
  }

  if (!difficulty) {
    const error = new Error("Difficulty is required");
    error.statusCode = 400;
    throw error;
  }

  if (!role?.trim()) {
    const error = new Error("Role is required");
    error.statusCode = 400;
    throw error;
  }

  if (!categoryId) {
    const error = new Error("Category is required");
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;

      if (!row.question?.trim()) {
        const error = new Error(
          `Question is required on CSV row ${rowNumber}`
        );

        error.statusCode = 400;
        error.row = rowNumber;
        throw error;
      }

      const expectedTopics = row.expected_topics
        ? row.expected_topics
            .split(",")
            .map((topic) => topic.trim())
            .filter(Boolean)
        : [];

      const answerKeyPoints = row.answer_keypoints
        ? row.answer_keypoints
            .split(",")
            .map((point) => point.trim())
            .filter(Boolean)
        : [];

      await client.query(
        `
        INSERT INTO questions (
          interview_type,
          role,
          domain,
          difficulty,
          text,
          expected_topics,
          reference_answer,
          answer_key_points,
          category_id,
          is_active
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
        `,
        [
          interviewType,
          role.trim(),
          domainId || null,
          difficulty,
          row.question.trim(),
          JSON.stringify(expectedTopics),
          row.reference_answer?.trim() || "",
          JSON.stringify(answerKeyPoints),
          categoryId,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      message: "Questions uploaded successfully",
      insertedCount: rows.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateQuestion(id, data) {
  const result = await pool.query(
    `
    UPDATE questions
    SET
      interview_type = COALESCE($1, interview_type),
      role = COALESCE($2, role),
      domain = COALESCE($3, domain),
      difficulty = COALESCE($4, difficulty),
      text = COALESCE($5, text),
      expected_topics = COALESCE($6, expected_topics),
      reference_answer = COALESCE($7, reference_answer),
      answer_key_points = COALESCE($8, answer_key_points),
      category_id = COALESCE($9, category_id),
      is_active = COALESCE($10, is_active),
      updated_at = NOW()
    WHERE id = $11
    RETURNING *
    `,
    [
      data.interviewType,
      data.role,
      data.domain,
      data.difficulty,
      data.text,
      data.expectedTopics
        ? JSON.stringify(data.expectedTopics)
        : null,
      data.referenceAnswer,
      data.answerKeyPoints
        ? JSON.stringify(data.answerKeyPoints)
        : null,
      data.categoryId,
      data.isActive,
      id,
    ]
  );

  return result.rows[0] || null;
}

async function deactivateQuestion(id) {
  const result = await pool.query(
    `
    UPDATE questions
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  listQuestions,
  createQuestion,
  bulkUploadQuestions,
  updateQuestion,
  deactivateQuestion,
};