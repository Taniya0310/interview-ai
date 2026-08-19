const db = require('../config/database');

async function findForInterview(interviewId) {
  const result = await db.query(
    `SELECT iq.*, q.*
     FROM interview_questions iq
     JOIN questions q ON q.id = iq.question_id
     WHERE iq.interview_id = $1
     ORDER BY iq.position`,
    [interviewId]
  );

  return result.rows;
}

module.exports = { findForInterview };
