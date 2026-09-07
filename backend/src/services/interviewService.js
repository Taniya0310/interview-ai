const db = require("../config/database");

async function createInterview(data, userId) {
  const interviewType = String(
    data.interviewType || ""
  ).trim();

  const domain =
    interviewType === "technical"
      ? String(data.domain || "").trim().toLowerCase()
      : null;

  if (!userId) {
    throw Object.assign(
      new Error("Authenticated user is required"),
      { status: 401 }
    );
  }

  const allowedTypes = [
    "technical",
    "non-technical",
    "mixed"
  ];

  if (!allowedTypes.includes(interviewType)) {
    throw Object.assign(
      new Error(
        "interviewType must be technical, non-technical, or mixed"
      ),
      { status: 400 }
    );
  }

  if (interviewType === "technical" && !domain) {
    throw Object.assign(
      new Error(
        "Technical domain is required for technical interviews"
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

    const interview = interviewResult.rows[0];

    const questionResult = await client.query(
      `
        SELECT *
        FROM questions
        WHERE is_active = TRUE
          AND (
            interview_type = $1
            OR (
              $1 = 'mixed'
              AND interview_type IN (
                'technical',
                'non-technical'
              )
            )
          )
          AND (
            $1 <> 'technical'
            OR domain = $2
          )
        ORDER BY created_at ASC
      `,
      [interviewType, domain]
    );

    if (questionResult.rows.length === 0) {
      throw Object.assign(
        new Error(
          `No active ${interviewType} questions are available${
            domain ? ` for domain ${domain}` : ""
          }`
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
async function getDayStreak(userId) {
  const result = await db.query(
  `
    SELECT DISTINCT activity_date
    FROM (
      SELECT
        (completed_at AT TIME ZONE 'UTC')::date AS activity_date
      FROM interviews
      WHERE user_id = $1
        AND status = 'completed'
        AND completed_at IS NOT NULL

      UNION

      SELECT
        (completed_at AT TIME ZONE 'UTC')::date AS activity_date
      FROM training_sessions
      WHERE user_id = $1
        AND status = 'completed'
        AND completed_at IS NOT NULL
    ) AS user_activity
    ORDER BY activity_date DESC
  `,
  [userId]
);

  const dates = result.rows.map((row) =>
    String(row.activity_date)
  );

  if (dates.length === 0) {
    return 0;
  }

  const today = new Date();

  const todayDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    )
  );

  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setUTCDate(
    yesterdayDate.getUTCDate() - 1
  );

  const latestDate = new Date(
    `${dates[0]}T00:00:00Z`
  );

  const isToday =
    latestDate.getTime() === todayDate.getTime();

  const isYesterday =
    latestDate.getTime() === yesterdayDate.getTime();

  if (!isToday && !isYesterday) {
    return 0;
  }

  let streak = 0;
  let expectedDate = latestDate;

  for (const date of dates) {
    const activityDate = new Date(
      `${date}T00:00:00Z`
    );

    if (
      activityDate.getTime() !==
      expectedDate.getTime()
    ) {
      break;
    }

    streak += 1;

    expectedDate.setUTCDate(
      expectedDate.getUTCDate() - 1
    );
  }

  return streak;
}
async function listInterviews(userId) {
  const result = await db.query(
  `
    SELECT
      i.*,

      (
        SELECT ROUND(
          AVG((an.result->>'score')::numeric)
        )
        FROM interview_questions iq2
        JOIN answers a2
          ON a2.interview_question_id = iq2.id
        JOIN analyses an
          ON an.answer_id = a2.id
        WHERE iq2.interview_id = i.id
          AND an.result->>'score' IS NOT NULL
      ) AS score,

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
  quitStale: quitStaleInterviews,
  getDayStreak
};