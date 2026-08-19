const db = require('../config/database');

async function createInterview(data) {
  const questionCount = Number(data.questionCount);

  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 100) {
    throw Object.assign(new Error('questionCount must be between 1 and 100'), { status: 400 });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const interviewResult = await client.query(
      `INSERT INTO interviews (interview_type, role, difficulty, status)
       VALUES ($1, $2, $3, 'in_progress')
       RETURNING *`,
      [data.interviewType, data.role, data.difficulty]
    );

    const interview = interviewResult.rows[0];
    const questionResult = await client.query(
      `SELECT * FROM questions
       WHERE interview_type = $1
         AND role = $2
         AND difficulty = $3
         AND is_active = true
       ORDER BY random()
       LIMIT $4`,
      [data.interviewType, data.role, data.difficulty, questionCount]
    );

    if (questionResult.rows.length < questionCount) {
      throw Object.assign(
        new Error(`Only ${questionResult.rows.length} matching questions are available`),
        { status: 400 }
      );
    }

    for (let index = 0; index < questionResult.rows.length; index += 1) {
      await client.query(
        `INSERT INTO interview_questions (interview_id, question_id, position)
         VALUES ($1, $2, $3)`,
        [interview.id, questionResult.rows[index].id, index + 1]
      );
    }

    const selectedQuestions = await client.query(
      `SELECT iq.id AS interview_question_id,
              iq.position,
              iq.follow_up_count,
              q.*
       FROM interview_questions iq
       JOIN questions q ON q.id = iq.question_id
       WHERE iq.interview_id = $1
       ORDER BY iq.position`,
      [interview.id]
    );

    await client.query('COMMIT');
    return { ...interview, questions: selectedQuestions.rows };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getInterview(id) {
  const result = await db.query(
    `SELECT i.*,
            COALESCE(json_agg(
              json_build_object('id', iq.id, 'position', iq.position, 'question', q)
              ORDER BY iq.position
            ) FILTER (WHERE iq.id IS NOT NULL), '[]') AS questions
     FROM interviews i
     LEFT JOIN interview_questions iq ON iq.interview_id = i.id
     LEFT JOIN questions q ON q.id = iq.question_id
     WHERE i.id = $1
     GROUP BY i.id`,
    [id]
  );

  return result.rows[0];
}

async function finishInterview(id) {
  const result = await db.query(
    `UPDATE interviews
     SET status = 'processing'
     WHERE id = $1 AND status = 'in_progress'
     RETURNING *`,
    [id]
  );

  if (!result.rowCount) {
    throw Object.assign(new Error('Interview is not active'), { status: 409 });
  }

  return result.rows[0];
}

module.exports = {
  create: createInterview,
  get: getInterview,
  finish: finishInterview,
};
