const questionService =
  require("./questionService");

const trainingModel =
  require("../models/trainingModel");

const geminiService =
  require("./geminiService");

async function getQuestions(
  categoryId,
  limit = 5
) {
  if (!categoryId) {
    throw new Error(
      "Category ID is required"
    );
  }

  const safeLimit = Math.min(
    Math.max(Number(limit) || 5, 1),
    20
  );

  return questionService.listTraining(
    Number(categoryId),
    safeLimit
  );
}

async function createSession(userId, data = {}) {
  try {
    const categoryId = Number(data.categoryId);

    const limit = Math.min(
      Math.max(Number(data.limit) || 5, 1),
      20
    );

    if (!categoryId) {
      throw new Error("Category ID is required");
    }

    const questions = await getQuestions(
      categoryId,
      limit
    );

    if (!questions.length) {
      throw new Error("No training questions found");
    }

    const session =
      await trainingModel.createSession(
        userId,
        categoryId,
        data.difficulty || null,
        questions.length
      );

    return {
      session,
      questions,
    };
  } catch (error) {
    console.error("[TRAINING SESSION ERROR]", {
      userId,
      requestBody: data,
      message: error.message,
      detail: error.detail,
      code: error.code,
    });

    throw error;
  }
}

async function submitAnswer(
  userId,
  sessionId,
  data = {}
) {
  const session =
    await trainingModel.findSessionById(
      sessionId,
      userId
    );

  if (!session) {
    throw new Error(
      "Training session not found"
    );
  }

  if (!data.questionId) {
    throw new Error(
      "Question ID is required"
    );
  }

  if (!data.file) {
    throw new Error(
      "Audio file is required"
    );
  }

  const question =
    await questionService.findById(
      data.questionId
    );

  if (!question) {
    throw new Error(
      "Question not found"
    );
  }

  const audioPath =
    data.file.path ||
    data.file.filename;

  const audioMimeType =
    data.file.mimetype ||
    "audio/webm";

 const analysis =
  await geminiService.evaluateAudioAnswer({
    filePath: audioPath,
    mimeType: audioMimeType,
    question: question.text,
    referenceAnswer:
      question.reference_answer || "",
    expectedTopics:
      question.answer_key_points || [],
    userId,
    requestType: "training_audio_analysis",
  });

  const answer =
    await trainingModel.createAnswer(
      sessionId,
      data.questionId,
      data.answerText || null,
      audioPath,
      audioMimeType,
      data.durationSeconds,
      analysis
    );

  return {
    answer,
    analysis,
    action:
      analysis?.action || "next_question",
    nextQuestion:
      analysis?.nextQuestion || null,
    message:
      "Answer analyzed successfully"
  };
}

async function completeSession(
  userId,
  sessionId
) {
  const session =
    await trainingModel.completeSession(
      sessionId,
      userId
    );

  if (!session) {
    throw new Error(
      "Training session not found"
    );
  }

  return session;
}

module.exports = {
  getQuestions,
  createSession,
  submitAnswer,
  completeSession
};