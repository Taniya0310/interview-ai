const db = require("../config/database");

async function createSession(
  userId,
  categoryId,
  difficulty,
  totalQuestions
) {
  const result = await db.query(
    `
      INSERT INTO training_sessions (
        user_id,
        category_id,
        difficulty,
        total_questions
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      userId,
      categoryId || null,
      difficulty || null,
      totalQuestions
    ]
  );

  return result.rows[0];
}

async function findSessionById(
  sessionId,
  userId
) {
  const result = await db.query(
    `
      SELECT *
      FROM training_sessions
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [sessionId, userId]
  );

  return result.rows[0] || null;
}

async function createAnswer(
  sessionId,
  questionId,
  answerText,
  audioPath,
  audioMimeType,
  durationSeconds,
  analysis
) {
  const result = await db.query(
    `
      INSERT INTO training_answers (
        training_session_id,
        question_id,
        answer_text,
        audio_path,
        audio_mime_type,
        duration_seconds,
        analysis,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        'completed'
      )
      RETURNING *
    `,
    [
      sessionId,
      questionId,
      answerText || null,
      audioPath || null,
      audioMimeType || null,
      durationSeconds || null,
      analysis || null
    ]
  );

 await db.query(
  `
    UPDATE training_sessions
    SET completed_questions =
      LEAST(completed_questions + 1, total_questions)
    WHERE id = $1
  `,
  [sessionId]
);

  return result.rows[0];
}

async function completeSession(
  sessionId,
  userId
) {
  const result = await db.query(
    `
      UPDATE training_sessions
      SET
        status = 'completed',
        completed_at = NOW()
      WHERE id = $1
        AND user_id = $2
      RETURNING *
    `,
    [sessionId, userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createSession,
  findSessionById,
  createAnswer,
  completeSession
};