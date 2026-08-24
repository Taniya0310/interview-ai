const db = require("../config/database");

async function createInterview(data) {
  const interviewType = String(
    data.interviewType || ""
  ).trim();

  const allowedTypes = [
    "technical",
    "non-technical",
  ];

  if (!allowedTypes.includes(interviewType)) {
    throw Object.assign(
      new Error(
        "interviewType must be technical or non-technical"
      ),
      { status: 400 }
    );
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const interviewResult = await client.query(
      `
      INSERT INTO interviews (
        interview_type,
        status
      )
      VALUES ($1, 'in_progress')
      RETURNING *
      `,
      [interviewType]
    );

    const interview = interviewResult.rows[0];

    const questionResult = await client.query(
      `
      SELECT *
      FROM questions
      WHERE interview_type = $1
        AND is_active = TRUE
      ORDER BY created_at ASC
      `,
      [interviewType]
    );

    if (questionResult.rows.length === 0) {
      throw Object.assign(
        new Error(
          `No active ${interviewType} questions are available`
        ),
        { status: 400 }
      );
    }

    for (
      let index = 0;
      index < questionResult.rows.length;
      index += 1
    ) {
      await client.query(
        `
        INSERT INTO interview_questions (
          interview_id,
          question_id,
          position
        )
        VALUES ($1, $2, $3)
        `,
        [
          interview.id,
          questionResult.rows[index].id,
          index + 1,
        ]
      );
    }

    const selectedQuestions = await client.query(
      `
      SELECT
        iq.id AS interview_question_id,
        iq.position,
        iq.follow_up_count,
        q.*
      FROM interview_questions iq
      JOIN questions q
        ON q.id = iq.question_id
      WHERE iq.interview_id = $1
      ORDER BY iq.position
      `,
      [interview.id]
    );

    await client.query("COMMIT");

    return {
      ...interview,
      questions: selectedQuestions.rows,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getInterview(id) {
  const result = await db.query(
    `
    SELECT
      i.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', iq.id,
            'position', iq.position,
            'question', q
          )
          ORDER BY iq.position
        ) FILTER (WHERE iq.id IS NOT NULL),
        '[]'
      ) AS questions
    FROM interviews i
    LEFT JOIN interview_questions iq
      ON iq.interview_id = i.id
    LEFT JOIN questions q
      ON q.id = iq.question_id
    WHERE i.id = $1
    GROUP BY i.id
    `,
    [id]
  );

  return result.rows[0];
}
async function listInterviews() {
  const result = await db.query(
    `
    SELECT
      i.*,
      COUNT(iq.id) AS question_count,
      COUNT(iq.id) FILTER (
        WHERE iq.is_satisfied = TRUE
      ) AS completed_questions
    FROM interviews i
    LEFT JOIN interview_questions iq
      ON iq.interview_id = i.id
    GROUP BY i.id
    ORDER BY i.created_at DESC
    `
  );

  return result.rows;
}
async function finishInterview(id) {
  const result = await db.query(
    `
    UPDATE interviews
    SET status = 'completed',
        completed_at = COALESCE(
          completed_at,
          NOW()
        )
    WHERE id = $1
      AND status IN ('in_progress', 'processing')
    RETURNING *
    `,
    [id]
  );

  if (result.rowCount) {
    return result.rows[0];
  }

  const existing = await db.query(
    `
    SELECT *
    FROM interviews
    WHERE id = $1
    `,
    [id]
  );

  if (
    existing.rowCount &&
    existing.rows[0].status === "completed"
  ) {
    return existing.rows[0];
  }

  throw Object.assign(
    new Error("Interview is not active"),
    { status: 409 }
  );
}

module.exports = {
  create: createInterview,
  list: listInterviews,
  get: getInterview,
  finish: finishInterview,
};