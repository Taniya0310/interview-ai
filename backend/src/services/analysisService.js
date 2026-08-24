const db = require("../config/database");
const gemini = require("./geminiService");
const scoring = require("../utils/scoring");
const logger = require("../utils/logger");
const transcriptionService = require("./transcriptionService");

async function processFastAnswer(answerId) {
  const result = await db.query(
    `SELECT
       a.*,
       iq.follow_up_count,
       q.text AS question,
       q.expected_topics,
       q.reference_answer,
       q.answer_key_points
     FROM answers a
     JOIN interview_questions iq
       ON iq.id = a.interview_question_id
     JOIN questions q
       ON q.id = iq.question_id
     WHERE a.id = $1`,
    [answerId]
  );

  const answer = result.rows[0];

  if (!answer) {
    logger.error("Answer not found", { answerId });
    return;
  }

  try {
    await db.query(
      `UPDATE answers
       SET status = 'processing'
       WHERE id = $1`,
      [answerId]
    );

    const decision =
      await transcriptionService.evaluateVideoAudio({
        videoPath: answer.video_path,
        question: answer.question,
        expectedTopics: answer.expected_topics,
        referenceAnswer: answer.reference_answer,
        answerKeyPoints: answer.answer_key_points,
      });

    const transcript = decision.transcript || "";

    logger.info("Combined audio evaluation completed", {
      answerId,
      interviewId: answer.interview_id,
      transcript: transcript || "[Transcript unavailable]",
      passed: decision.passed,
      score: decision.score,
      missingPoints: decision.missingPoints,
      needsFollowUp: decision.needsFollowUp,
      followUpQuestion: decision.followUpQuestion,
      questionFeedback: decision.questionFeedback,
    });

    const needsFollowUp =
      Boolean(decision.needsFollowUp) &&
      answer.follow_up_count < 5;

    const liveResult = {
      transcript,
      passed: Boolean(decision.passed),
      score: decision.score || 0,
      missingPoints: decision.missingPoints || [],
      needsFollowUp,
      followUpQuestion: needsFollowUp
        ? decision.followUpQuestion
        : null,
      questionFeedback:
        decision.questionFeedback || null,
      metricsPending: true,
    };

    await db.query(
      `INSERT INTO analyses
        (answer_id, result, status)
       VALUES ($1, $2, 'processing')
       ON CONFLICT (answer_id)
       DO UPDATE SET
         result = $2,
         status = 'processing'`,
      [answerId, JSON.stringify(liveResult)]
    );

    await db.query(
      `UPDATE answers
       SET status = 'analyzed'
       WHERE id = $1`,
      [answerId]
    );

    if (needsFollowUp) {
      await db.query(
        `UPDATE interview_questions
         SET follow_up_count = follow_up_count + 1
         WHERE id = $1`,
        [answer.interview_question_id]
      );
    } else {
      await db.query(
        `UPDATE interview_questions
         SET is_satisfied = TRUE
         WHERE id = $1`,
        [answer.interview_question_id]
      );

      await finalizeInterview(answer.interview_id);

      runDetailedQuestionAnalysis(
        answer.interview_question_id,
        answer.interview_id
      ).catch((error) => {
        logger.error("Detailed video analysis failed", {
          answerId,
          error: error.message,
        });
      });
    }
  } catch (error) {
    logger.error("Fast audio analysis failed", {
      answerId,
      error: error.message,
    });

    await db.query(
      `UPDATE answers
       SET status = 'failed',
           error_message = $2
       WHERE id = $1`,
      [answerId, error.message]
    );
  }
}

async function runDetailedQuestionAnalysis(
  interviewQuestionId,
  interviewId
) {
  const result = await db.query(
    `SELECT
       a.id AS answer_id,
       a.video_path,
       a.mime_type,
       a.is_follow_up,
       a.created_at,
       q.text AS question,
       q.expected_topics,
       an.result
     FROM answers a
     JOIN interview_questions iq
       ON iq.id = a.interview_question_id
     JOIN questions q
       ON q.id = iq.question_id
     LEFT JOIN analyses an
       ON an.answer_id = a.id
     WHERE a.interview_question_id = $1
     ORDER BY a.created_at`,
    [interviewQuestionId]
  );

  if (!result.rowCount) {
    logger.info("No answers found for detailed analysis", {
      interviewQuestionId,
    });

    return;
  }

  const firstAnswer = result.rows[0];

  const transcripts = result.rows
    .map((row) => {
      const analysis =
        typeof row.result === "string"
          ? JSON.parse(row.result)
          : row.result;

      return {
        answerId: row.answer_id,
        isFollowUp: row.is_follow_up,
        transcript: analysis?.transcript || "",
      };
    })
    .filter((item) => item.transcript);

  logger.info("Starting detailed question analysis", {
    interviewId,
    interviewQuestionId,
    question: firstAnswer.question,
    answerCount: result.rows.length,
    transcripts,
  });

  const detailed = await gemini.analyze({
    filePath: firstAnswer.video_path,
    mimeType: firstAnswer.mime_type || "video/webm",
    question: firstAnswer.question,
    expectedTopics: firstAnswer.expected_topics,
    previousAnswers: transcripts,
  });

  logger.info("Detailed question analysis completed", {
    interviewId,
    interviewQuestionId,
    technicalCorrectness: detailed.technicalCorrectness,
    relevance: detailed.relevance,
    communication: detailed.communication,
    structure: detailed.structure,
    speakingBehavior: detailed.speakingBehavior,
    presentation: detailed.presentation,
    speechMetrics: detailed.speechMetrics,
    strengths: detailed.strengths,
    weaknesses: detailed.weaknesses,
    recommendations: detailed.recommendations,
    feedback: detailed.feedback,
  });

  const finalResult = {
    ...detailed,
    question: firstAnswer.question,
    answerCount: result.rows.length,
    transcripts,
    metricsPending: false,
  };

  await db.query(
    `UPDATE analyses
     SET result = $2,
         status = 'complete',
         completed_at = NOW()
     WHERE answer_id = $1`,
    [
      firstAnswer.answer_id,
      JSON.stringify(finalResult),
    ]
  );
}

async function finalizeInterview(interviewId) {
  const result = await db.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE is_satisfied = TRUE
       ) AS satisfied,
       COUNT(*) AS total
     FROM interview_questions
     WHERE interview_id = $1`,
    [interviewId]
  );

  const row = result.rows[0];

  if (
    Number(row.total) > 0 &&
    Number(row.satisfied) === Number(row.total)
  ) {
    await db.query(
      `UPDATE interviews
       SET status = 'completed',
           completed_at = NOW()
       WHERE id = $1
         AND status IN ('in_progress', 'processing')`,
      [interviewId]
    );
  }
}

async function report(interviewId) {
  const result = await db.query(
    `SELECT
       i.id,
       i.status,
       i.created_at,
       i.completed_at,
       iq.position,
       iq.follow_up_count,
       iq.is_satisfied,
       q.text AS question,
       a.id AS answer_id,
       a.status AS answer_status,
       a.is_follow_up,
       an.result
     FROM interviews i
     JOIN interview_questions iq
       ON iq.interview_id = i.id
     JOIN questions q
       ON q.id = iq.question_id
     LEFT JOIN answers a
       ON a.interview_question_id = iq.id
     LEFT JOIN analyses an
       ON an.answer_id = a.id
     WHERE i.id = $1
     ORDER BY iq.position, a.created_at`,
    [interviewId]
  );

  if (!result.rowCount) {
    return null;
  }

  const analyses = result.rows
    .map((row) => {
      const value =
        typeof row.result === "string"
          ? JSON.parse(row.result)
          : row.result;

      return value?.metricsPending === false
        ? value
        : null;
    })
    .filter(Boolean)
    .map((value) =>
      typeof value === "string"
        ? JSON.parse(value)
        : value
    );

  return {
    id: interviewId,
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at,
    completedAt: result.rows[0].completed_at,
    scores: scoring.average(analyses),
    answers: result.rows.map((row) => ({
      ...row,
      result:
        typeof row.result === "string"
          ? JSON.parse(row.result)
          : row.result,
    })),
  };
}

module.exports = {
  processFastAnswer,
  report,
};