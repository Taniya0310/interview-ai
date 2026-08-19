const db = require('../config/database');
const analysisService = require('./analysisService');
const logger = require('../utils/logger');

async function createAnswer({ interviewId, interviewQuestionId, file, parentAnswerId }) {
  logger.info('Answer upload received', { interviewId, interviewQuestionId, parentAnswerId, path: file?.path, mimeType: file?.mimetype, size: file?.size });
  const question = await db.query(
    `SELECT id FROM interview_questions
     WHERE id = $1 AND interview_id = $2`,
    [interviewQuestionId, interviewId]
  );

  if (!question.rowCount) {
    logger.error('Answer rejected: question does not belong to interview', { interviewId, interviewQuestionId });
    throw Object.assign(new Error('Question does not belong to this interview'), {
      status: 404,
    });
  }

  const result = await db.query(
    `INSERT INTO answers
       (interview_id, interview_question_id, video_path, mime_type, status, is_follow_up, parent_answer_id)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6)
     RETURNING *`,
    [interviewId, interviewQuestionId, file.path, file.mimetype, Boolean(parentAnswerId), parentAnswerId || null]
  );

  logger.info('Answer saved; starting background analysis', { answerId: result.rows[0].id });
  analysisService.process(result.rows[0].id).catch((error) => logger.error('Background analysis crashed', { answerId: result.rows[0].id, error: error.message }));
  return result.rows[0];
}

async function getAnswer(id) {
  const result = await db.query('SELECT * FROM answers WHERE id = $1', [id]);
  return result.rows[0];
}

async function listAnswers(interviewId) {
  const result = await db.query(
    `SELECT * FROM answers
     WHERE interview_id = $1
     ORDER BY created_at`,
    [interviewId]
  );
  return result.rows;
}

module.exports = {
  create: createAnswer,
  get: getAnswer,
  list: listAnswers,
};
