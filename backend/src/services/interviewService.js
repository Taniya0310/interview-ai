const db = require("../config/database");

async function createInterview(data, userId) {
  const interviewType = String(
    data.interviewType || ""
  ).trim();

  if (!userId) {
    throw Object.assign(
      new Error("Authenticated user is required"),
      { status: 401 }
    );
  }

  const allowedTypes = [
    "technical",
    "non-technical"
  ];

  if (!allowedTypes.includes(interviewType)) {
    throw Object.assign(
      new Error(
        "interviewType must be technical or non-technical"
      ),
      { status: 400 }
    );
  }

  const client =
    await db.pool.connect();

  try {
    await client.query("BEGIN");

    const interviewResult =
      await client.query(
        `
          INSERT INTO interviews (
  user_id,
  interview_type,
  status,
  last_seen_at
)
VALUES (
  $1,
  $2,
  'in_progress',
  CURRENT_TIMESTAMP
)
          RETURNING *
        `,
        [userId, interviewType]
      );

    const interview =
      interviewResult.rows[0];

    const questionResult =
      await client.query(
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
          index + 1
        ]
      );
    }

    const selectedQuestions =
      await client.query(
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
      questions: selectedQuestions.rows
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function quitStaleInterviews() {
  const result = await db.query(`
    UPDATE interviews
    SET status = 'quit',
        completed_at = COALESCE(
          completed_at,
          CURRENT_TIMESTAMP
        )
    WHERE status = 'in_progress'
      AND COALESCE(last_seen_at, created_at)
          < CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    RETURNING id
  `);

  return result.rows;
}
async function getInterview(id, userId) {
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
        AND i.user_id = $2
      GROUP BY i.id
    `,
    [id, userId]
  );

  return result.rows[0] || null;
}

async function listInterviews(userId) {
  const result = await db.query(
    `
      SELECT
        i.*,

        ROW_NUMBER() OVER (
          PARTITION BY i.user_id
          ORDER BY i.created_at ASC
        ) AS interview_number,

        COUNT(iq.id) AS question_count,

        COUNT(iq.id) FILTER (
          WHERE iq.is_satisfied = TRUE
        ) AS completed_questions

      FROM interviews i

      LEFT JOIN interview_questions iq
        ON iq.interview_id = i.id

      WHERE i.user_id = $1

      GROUP BY i.id

      ORDER BY i.created_at DESC
    `,
    [userId]
  );

  return result.rows;
}
async function heartbeat(id, userId) {
  const result = await db.query(
    `
      UPDATE interviews
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND user_id = $2
        AND status = 'in_progress'
    `,
    [id, userId]
  );

  if (!result.rowCount) {
    throw Object.assign(
      new Error("Interview not active"),
      { status: 404 }
    );
  }
}

async function quitInterview(id, userId) {
  await db.query(
    `
      UPDATE interviews
      SET status = 'quit',
          completed_at = COALESCE(
            completed_at,
            CURRENT_TIMESTAMP
          )
      WHERE id = $1
        AND user_id = $2
        AND status = 'in_progress'
    `,
    [id, userId]
  );
}
async function finishInterview(id, userId) {
  const result = await db.query(
    `
      UPDATE interviews
      SET status = 'completed',
          completed_at = COALESCE(
            completed_at,
            NOW()
          )
      WHERE id = $1
        AND user_id = $2
        AND status IN (
          'in_progress',
          'processing'
        )
      RETURNING *
    `,
    [id, userId]
  );

  if (result.rowCount) {
    return result.rows[0];
  }

  const existing = await db.query(
    `
      SELECT *
      FROM interviews
      WHERE id = $1
        AND user_id = $2
    `,
    [id, userId]
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
  heartbeat,
  quit: quitInterview,
  quitStale: quitStaleInterviews
};