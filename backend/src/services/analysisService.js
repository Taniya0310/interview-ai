const db = require('../config/database');
const gemini = require('./geminiService');
const scoring = require('../utils/scoring');
const logger = require('../utils/logger');

async function process(answerId) {
  logger.info('Analysis job started', { answerId });
  const result = await db.query(
    `SELECT a.*, iq.follow_up_count, q.text AS question, q.expected_topics
     FROM answers a
     JOIN interview_questions iq ON iq.id = a.interview_question_id
     JOIN questions q ON q.id = iq.question_id
     WHERE a.id = $1`,
    [answerId]
  );

  const answer = result.rows[0];
  if (!answer) { logger.error('Analysis answer not found', { answerId }); return; }

  try {
    await db.query("UPDATE answers SET status = 'processing' WHERE id = $1", [answerId]);

    const analysis = await gemini.analyze({
      filePath: answer.video_path,
      mimeType: answer.mime_type || 'video/webm',
      question: answer.question,
      expectedTopics: answer.expected_topics,
    });
    logger.info('Gemini analysis completed', { answerId, followUpCount: answer.follow_up_count, needsFollowUp: analysis.needsFollowUp });

    const needsFollowUp = Boolean(analysis.needsFollowUp) && answer.follow_up_count < 5;
    analysis.needsFollowUp = needsFollowUp;
    if (!needsFollowUp) analysis.followUpQuestion = null;

    await db.query(
      `INSERT INTO analyses (answer_id, result, status, completed_at)
       VALUES ($1, $2, 'complete', NOW())
       ON CONFLICT (answer_id)
       DO UPDATE SET result = $2, status = 'complete', completed_at = NOW()`,
      [answerId, JSON.stringify(analysis)]
    );

    await db.query("UPDATE answers SET status = 'analyzed' WHERE id = $1", [answerId]);
    logger.info('Analysis saved successfully', { answerId, needsFollowUp });

    if (needsFollowUp) {
      await db.query(
        `UPDATE interview_questions
         SET follow_up_count = follow_up_count + 1
         WHERE id = (SELECT interview_question_id FROM answers WHERE id = $1)`,
        [answerId]
      );
    } else {
      await db.query(
        `UPDATE interview_questions
         SET is_satisfied = TRUE
         WHERE id = (SELECT interview_question_id FROM answers WHERE id = $1)`,
        [answerId]
      );
      await finalizeInterview(answer.interview_id);
    }
  } catch (error) {
    logger.error('Analysis job failed', { answerId, error: error.message, stack: error.stack });
    await db.query(
      "UPDATE answers SET status = 'failed', error_message = $2 WHERE id = $1",
      [answerId, error.message]
    );
  }
}

async function finalizeInterview(interviewId) {
  const result = await db.query(
    `SELECT COUNT(*) FILTER (WHERE iq.is_satisfied) AS satisfied,
            COUNT(*) AS total
     FROM interview_questions iq
     WHERE iq.interview_id = $1`,
    [interviewId]
  );

  const row = result.rows[0];
  if (Number(row.total) > 0 && Number(row.satisfied) === Number(row.total)) {
    await db.query(
      `UPDATE interviews
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1 AND status = 'processing'`,
      [interviewId]
    );
  }
}

async function report(interviewId) {
  const result = await db.query(
    `SELECT i.id, i.status, i.created_at, i.completed_at,
            iq.position, iq.follow_up_count, iq.is_satisfied,
            q.text AS question, a.id AS answer_id, a.status AS answer_status,
            a.is_follow_up, an.result
     FROM interviews i
     JOIN interview_questions iq ON iq.interview_id = i.id
     JOIN questions q ON q.id = iq.question_id
     LEFT JOIN answers a ON a.interview_question_id = iq.id
     LEFT JOIN analyses an ON an.answer_id = a.id
     WHERE i.id = $1
     ORDER BY iq.position, a.created_at`,
    [interviewId]
  );

  if (!result.rowCount) return null;
  const analyses = result.rows.map((row) => row.result).filter(Boolean);

  return {
    id: interviewId,
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at,
    completedAt: result.rows[0].completed_at,
    scores: scoring.average(analyses),
    answers: result.rows.map((row) => ({
      ...row,
      result: typeof row.result === 'string' ? JSON.parse(row.result) : row.result,
    })),
  };
}

module.exports = { process, report };
