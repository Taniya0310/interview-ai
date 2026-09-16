const db = require("../config/database");
const gemini = require("./geminiService");
const scoring = require("../utils/scoring");
const logger = require("../utils/logger");
const transcriptionService = require("./transcriptionService");
const settingsService = require("./settingsService");
async function processFastAnswer(answerId) {

  const settings = await settingsService.getSettings();

const followUpLimit = Number(
  settings.follow_up_question_limit ?? 2
);
 const result = await db.query(
  `SELECT
     a.*,
     u.id AS user_id,
     i.user_id AS public_user_id,
     iq.follow_up_count,
     COALESCE(a.question_text, q.text) AS question,
     q.expected_topics,
     q.reference_answer,
     q.answer_key_points
   FROM answers a
   JOIN interviews i
     ON i.id = a.interview_id
   JOIN users u
     ON u.user_id = i.user_id
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
const previousAnalyses = await db.query(
  `SELECT result
   FROM analyses an
   JOIN answers a ON a.id = an.answer_id
   WHERE a.interview_question_id = $1
     AND a.id <> $2
   ORDER BY a.created_at`,
  [answer.interview_question_id, answerId]
);

const coveredTopics = previousAnalyses.rows.flatMap((row) => {
  const result =
    typeof row.result === "string"
      ? JSON.parse(row.result)
      : row.result;

  return Array.isArray(result?.coveredTopics)
    ? result.coveredTopics
    : [];
});
const expectedTopics = answer.expected_topics || [];

const remainingTopics = expectedTopics.filter(
  (topic) => !coveredTopics.includes(topic)
);
    const decision =
  await transcriptionService.evaluateVideoAudio({
    videoPath: answer.video_path,
    question: answer.question,
    expectedTopics,
    remainingTopics,
    coveredTopics,
    referenceAnswer: answer.reference_answer,
    answerKeyPoints: answer.answer_key_points,
    interviewId: answer.interview_id,
    userId: answer.user_id,
    answerId,
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

    const missingTopics = decision.missingTopics || [];

const needsFollowUp =
  missingTopics.length > 0 &&
  answer.follow_up_count < followUpLimit;

    const liveResult = {
  transcript,
  coveredTopics: decision.coveredTopics || [],
  missingTopics: decision.missingTopics || [],
  passed: Boolean(decision.passed),
  score: decision.score || 0,
  missingPoints: decision.missingPoints || [],
  needsFollowUp,
  followUpQuestion: needsFollowUp
    ? decision.followUpQuestion
    : null,
  questionFeedback: decision.questionFeedback || null,
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
).catch(async (error) => {
  logger.error("Detailed video analysis failed", {
    answerId,
    error: error.message,
  });

  try {
    await db.query(
      `UPDATE analyses an
       SET status = 'failed',
           result = COALESCE(an.result, '{}'::jsonb) ||
             jsonb_build_object(
               'metricsPending', false,
               'error', $2
             ),
           completed_at = NOW()
       FROM answers a
       WHERE an.answer_id = a.id
         AND a.interview_question_id = $1`,
      [answer.interview_question_id, error.message]
    );
  } catch (updateError) {
    logger.error("Failed to mark detailed analysis as failed", {
      answerId,
      error: updateError.message,
    });
  }
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

    try {
      await db.query(
        `INSERT INTO analyses
          (answer_id, result, status, completed_at)
         VALUES ($1, $2, 'failed', NOW())
         ON CONFLICT (answer_id)
         DO UPDATE SET
           result = EXCLUDED.result,
           status = 'failed',
           completed_at = NOW()`,
        [
          answerId,
          JSON.stringify({
            metricsPending: false,
            error: error.message,
          }),
        ]
      );
    } catch (analysisError) {
      logger.error("Failed to save failed analysis status", {
        answerId,
        error: analysisError.message,
      });
    }
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
     u.id AS user_id,
     i.user_id AS public_user_id,
     COALESCE(a.question_text, q.text) AS question,
     q.expected_topics,
     an.result
   FROM answers a
   JOIN interviews i
     ON i.id = a.interview_id
   JOIN users u
     ON u.user_id = i.user_id
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
  mimeType: firstAnswer.mime_type,
  question: firstAnswer.question,
  expectedTopics: firstAnswer.expected_topics || [],
  previousAnswers: transcripts,
  interviewId,
  userId: firstAnswer.user_id,
  answerId: firstAnswer.answer_id,
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

  await db.query(
  `UPDATE analyses an
   SET status = 'complete',
       result = jsonb_set(
         COALESCE(an.result, '{}'::jsonb),
         '{metricsPending}',
         'false'::jsonb
       ),
       completed_at = NOW()
   FROM answers a
   WHERE an.answer_id = a.id
     AND a.interview_question_id = $1`,
  [interviewQuestionId]
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
       COALESCE(a.question_text, q.text) AS question,
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
  .filter(
    (row) =>
      row.answer_id &&
      row.is_follow_up === false
  )
  .map((row) => {
    const value =
      typeof row.result === "string"
        ? JSON.parse(row.result)
        : row.result;

    return value?.metricsPending === false
      ? value
      : null;
  })
  .filter(Boolean);

  return {
    id: interviewId,
    status: result.rows[0].status,
    createdAt: result.rows[0].created_at,
    completedAt: result.rows[0].completed_at,
    scores: scoring.average(analyses),
    strengths: analyses.flatMap((item) => item.strengths || []),
    weakAreas: analyses.flatMap((item) => item.weaknesses || item.weakAreas || []),
    recommendations: analyses.flatMap((item) => item.recommendations || []),
    feedback: analyses.map((item) => item.feedback).filter(Boolean).join(" "),
    facialMetrics: analyses.length
      ? Object.fromEntries(Object.keys(analyses[0].facialMetrics || {}).map((key) => [
          key,
          Math.round(analyses.reduce((sum, item) => sum + Number(item.facialMetrics?.[key] || 0), 0) / analyses.length),
        ]))
      : {},
    speechMetrics: analyses.length
      ? Object.fromEntries(Object.keys(analyses[0].speechMetrics || {}).map((key) => [
          key,
          Math.round(analyses.reduce((sum, item) => sum + Number(item.speechMetrics?.[key] || 0), 0) / analyses.length),
        ]))
      : {},
   answers: result.rows
  .filter((row) => row.answer_id)
  .map((row) => {
    const parsedResult =
      typeof row.result === "string"
        ? JSON.parse(row.result)
        : row.result;

    return {
      ...row,

      questionType:
        row.is_follow_up === true
          ? "follow_up"
          : "main",

      result: parsedResult,

      score:
        parsedResult?.score ??
        parsedResult?.overallScore ??
        null,

      feedback:
        parsedResult?.feedback ??
        parsedResult?.questionFeedback ??
        null,

      transcript:
        parsedResult?.transcript ?? null,

      metricsPending:
        parsedResult?.metricsPending ?? false,
    };
  }),
  };
}

module.exports = {
  processFastAnswer,
  report,
};
