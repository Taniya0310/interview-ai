const fs = require('fs');

const {
  geminiApiKey,
  geminiModel,
} = require('../config/env');

const logger = require('../utils/logger');
const {
  recordGeminiUsage,
} = require("./aiUsageLogger");
function parseGeminiJson(data) {
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return JSON.parse(
    text.replace(/```json|```/g, '').trim()
  );
}

async function sendVideoToGemini({
  filePath,
  mimeType,
  prompt,
  timeout = 120000,
  interviewId = null,
  userId = null,
  answerId = null,
  requestType = "video_analysis",
}) {
  const startedAt = Date.now();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const videoBuffer = fs.readFileSync(filePath);
  const videoBase64 = videoBuffer.toString("base64");

  logger.info("Sending video to Gemini", {
    filePath,
    mimeType,
    bytes: videoBuffer.length,
    model: geminiModel,
  });

  let response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: videoBase64,
                  },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(timeout),
      }
    );
  } catch (error) {
    await recordGeminiUsage({
      interviewId,
      userId,
      answerId,
      requestType,
      model: geminiModel,
      status: "failed",
      errorMessage: error.message,
      latencyMs: Date.now() - startedAt,
    });

    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.text();

    await recordGeminiUsage({
      interviewId,
      userId,
      answerId,
      requestType,
      model: geminiModel,
      status: "failed",
      errorMessage: errorBody,
      latencyMs: Date.now() - startedAt,
    });

    const error = new Error(
      `Gemini request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  await recordGeminiUsage({
    interviewId,
    userId,
    answerId,
    requestType,
    model: geminiModel,
    usageMetadata: data.usageMetadata,
    latencyMs: Date.now() - startedAt,
  });

  const parsed = parseGeminiJson(data);

  logger.info("Gemini response parsed", parsed);

  return parsed;
}

async function sendAudioToGemini({
  filePath,
  mimeType = "audio/wav",
  prompt,
  timeout = 60000,
  interviewId = null,
  userId = null,
  answerId = null,
  requestType = "audio_analysis",
}) {
  const startedAt = Date.now();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  const audioBuffer = fs.readFileSync(filePath);
  const audioBase64 = audioBuffer.toString("base64");

  logger.info("Sending audio to Gemini", {
    filePath,
    mimeType,
    bytes: audioBuffer.length,
    model: geminiModel,
  });

  let response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(timeout),
      }
    );
  } catch (error) {
    await recordGeminiUsage({
      interviewId,
      userId,
      answerId,
      requestType,
      model: geminiModel,
      status: "failed",
      errorMessage: error.message,
      latencyMs: Date.now() - startedAt,
    });

    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.text();

    await recordGeminiUsage({
      interviewId,
      userId,
      answerId,
      requestType,
      model: geminiModel,
      status: "failed",
      errorMessage: errorBody,
      latencyMs: Date.now() - startedAt,
    });

    const error = new Error(
      `Gemini audio request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  await recordGeminiUsage({
    interviewId,
    userId,
    answerId,
    requestType,
    model: geminiModel,
    usageMetadata: data.usageMetadata,
    latencyMs: Date.now() - startedAt,
  });

  return parseGeminiJson(data);
}
async function evaluateAudioAnswer({
  filePath,
  mimeType = "audio/wav",
  question,
  expectedTopics = [],
  referenceAnswer = "",
  answerKeyPoints = [],
  interviewId = null,
  userId = null,
  answerId = null,
}) {
  if (!geminiApiKey) {
    return {
      transcript: "",
      passed: false,
      score: 0,
      missingPoints: [],
      needsFollowUp: false,
      followUpQuestion: null,
      questionFeedback:
        "Gemini is not configured"
    };
  }

  if (!filePath) {
    throw new Error(
      "Audio file path is required"
    );
  }

 const prompt = `
Evaluate this training answer.

Question:
${question}

Reference answer:
${referenceAnswer || "None"}

Key points:
${JSON.stringify(
  answerKeyPoints?.length
    ? answerKeyPoints
    : expectedTopics || []
)}

Analyze the attached audio and return ONLY valid JSON:

{
  "transcript": "complete transcription",
  "passed": true,
  "score": 0,
  "missingPoints": [],
  "needsFollowUp": false,
  "followUpQuestion": null,
  "questionFeedback": "short useful feedback"
}

Rules:
- Score from 0 to 100.
- Accept different wording with the same meaning.
- Ask one short follow-up only if the answer is incomplete.
- If a follow-up question is needed, write it in natural Indian English.
- Keep it short and easy to speak aloud.
- Avoid complex words and American expressions.
- Make it suitable for an Indian English TTS voice.
`;

 const result = await sendAudioToGemini({
  filePath,
  mimeType,
  prompt,
  timeout: 60000,
  interviewId,
  userId,
  answerId,
  requestType: "audio_analysis",
});
  const analysis = {
    transcript: result.transcript || "",
    passed: Boolean(result.passed),
    score: Number(result.score) || 0,
    missingPoints: Array.isArray(
      result.missingPoints
    )
      ? result.missingPoints
      : [],
    needsFollowUp: Boolean(
      result.needsFollowUp
    ),
    followUpQuestion:
      result.followUpQuestion || null,
    questionFeedback:
      result.questionFeedback || ""
  };

  logger.info(
    "Training audio evaluation completed",
    {
      mimeType,
      score: analysis.score,
      passed: analysis.passed,
      needsFollowUp:
        analysis.needsFollowUp
    }
  );

  return analysis;
}
function isRetryableError(error) {
  return (
    error?.status === 429 ||
    error?.status === 500 ||
    error?.status === 503 ||
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    error?.message?.includes('aborted') ||
    error?.message?.includes('timeout')
  );
}

async function evaluateWithRetry(args, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await sendVideoToGemini({
        ...args,
        timeout: 120000,
      });
    } catch (error) {
      const shouldRetry = isRetryableError(error);

      if (!shouldRetry || attempt === retries) {
        throw error;
      }

      const delay = attempt * 3000;

      logger.info('Retrying Gemini fast evaluation', {
        attempt,
        nextAttempt: attempt + 1,
        delay,
        error: error.message,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }

  throw new Error('Gemini evaluation failed after retries');
}

async function evaluateAnswer({
  filePath,
  mimeType,
  question,
  expectedTopics,
  interviewId = null,
  userId = null,
  answerId = null,
}) {
  if (!geminiApiKey) {
    return {
      transcript: null,
      needsFollowUp: false,
      followUpQuestion: null,
      questionFeedback: 'Gemini is not configured',
    };
  }

  const prompt = `
Evaluate the candidate's answer only for relevance, coherence,
and whether it satisfies the interview question.

Question:
${question}

Expected topics:
${JSON.stringify(expectedTopics || [])}

Return ONLY valid JSON:
{
  "transcript": "exact transcription of what the candidate said",
  "needsFollowUp": true,
  "followUpQuestion": "string or null",
  "questionFeedback": "short explanation"
}

Rules:
- Use natural Indian English wording.
- Keep the follow-up question short and professional.
- Use simple words that are easy to pronounce.
- Avoid American slang and idioms.
- If no follow-up is needed, return null.
- Write the follow-up question as it should be spoken aloud by an Indian English TTS voice.
`;

  const result = await evaluateWithRetry({
  filePath,
  mimeType,
  prompt,
  interviewId,
  userId,
  answerId,
  requestType: "answer_analysis",
});

  logger.info('Fast answer evaluation completed', {
    question,
    transcript: result.transcript,
    needsFollowUp: result.needsFollowUp,
    followUpQuestion: result.followUpQuestion,
    questionFeedback: result.questionFeedback,
  });

  return result;
}


async function transcribeAudio({
  filePath,
  mimeType = "audio/wav",
  interviewId = null,
  userId = null,
  answerId = null,
}) {
  if (!geminiApiKey) {
    logger.warn("Gemini API key is missing");
    return "";
  }

  const prompt = `
Transcribe the candidate's spoken interview answer.

Rules:
- Return only valid JSON.
- Do not add explanations.
- Preserve the exact meaning.
- Do not invent missing words.

Return:
{
  "transcript": "complete transcript"
}
`;

  const result = await sendAudioToGemini({
  filePath,
  mimeType,
  prompt,
  requestType: "transcription",
  interviewId,
  userId,
  answerId,
});
  const transcript = result.transcript || "";

  logger.info("Audio transcript generated", {
    transcript,
  });

  return transcript;
}
async function sendTextToGemini({
  prompt,
  timeout = 60000,
  interviewId = null,
  userId = null,
  answerId = null,
  requestType = "text_analysis",
}) {
  const startedAt = Date.now();

  let response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
        signal: AbortSignal.timeout(timeout),
      }
    );
  } catch (error) {
    await recordGeminiUsage({
      interviewId,
      userId,
      answerId,
      requestType,
      model: geminiModel,
      status: "failed",
      errorMessage: error.message,
      latencyMs: Date.now() - startedAt,
    });

    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.text();

    await recordGeminiUsage({
      interviewId,
      userId,
      answerId,
      requestType,
      model: geminiModel,
      status: "failed",
      errorMessage: errorBody,
      latencyMs: Date.now() - startedAt,
    });

    const error = new Error(
      `Gemini text request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  await recordGeminiUsage({
    interviewId,
    userId,
    answerId,
    requestType,
    model: geminiModel,
    usageMetadata: data.usageMetadata,
    latencyMs: Date.now() - startedAt,
  });

  return parseGeminiJson(data);
}
async function evaluateTranscript({
  transcript,
  question,
  expectedTopics,
  interviewId = null,
  userId = null,
  answerId = null,
}) {
  if (!geminiApiKey) {
    return {
      needsFollowUp: false,
      followUpQuestion: null,
      questionFeedback: "Gemini is not configured",
    };
  }

  const prompt = `
Evaluate the candidate's interview answer using only the transcript.

Question:
${question}

Expected topics:
${JSON.stringify(expectedTopics || [])}

Candidate transcript:
${transcript || "[No transcript available]"}

Decide whether the candidate answered the question sufficiently.

Return ONLY valid JSON:
{
  "needsFollowUp": true,
  "followUpQuestion": "string or null",
  "questionFeedback": "short feedback"
}

Rules:
- needsFollowUp must be true or false.
- Ask a follow-up only when the answer is incomplete, unclear, or incorrect.
- If the answer is sufficient, return false and followUpQuestion as null.
- Use natural Indian English wording.
- Keep the follow-up question short and professional.
- Use simple words suitable for speech.
- Avoid American slang, idioms, and difficult pronunciation.
- Write the question as it should be spoken by an Indian English TTS voice.
`;

const result = await sendTextToGemini({
  prompt,
  timeout: 60000,
  interviewId,
  userId,
  answerId,
  requestType: "transcript_analysis",
});

  logger.info("Transcript evaluated by Gemini", {
    transcript,
    needsFollowUp: result.needsFollowUp,
    followUpQuestion: result.followUpQuestion,
    questionFeedback: result.questionFeedback,
  });

  return result;
}
async function analyze({
  filePath,
  mimeType,
  question,
  expectedTopics,
  previousAnswers = [],
  interviewId = null,
  userId = null,
  answerId = null,
}) {
  if (!geminiApiKey) {
    return {
      transcript: null,
      technicalCorrectness: 0,
      relevance: 0,
      communication: 0,
      structure: 0,
      speakingBehavior: 0,
      presentation: 0,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      speechMetrics: {},
      facialMetrics: { eyeContact: 0, facialExpression: 0, attentiveness: 0 },
      feedback: 'Gemini is not configured',
      questionFeedback: null,
    };
  }

  const previousAnswerText = previousAnswers
    .map(
      (answer, index) =>
        `Answer ${index + 1}${
          answer.isFollowUp ? ' (follow-up)' : ''
        }:
${answer.transcript || '[Transcript unavailable]'}`
    )
    .join('\n\n');

  const prompt = `
Analyze the candidate's complete response to this predefined interview question.

Question:
${question}

Expected topics:
${JSON.stringify(expectedTopics || [])}

Candidate's answer chain:
${previousAnswerText || '[No transcript available]'}

Evaluate the candidate's overall performance across the original answer
and all follow-up answers.

Return ONLY valid JSON:
{
  "transcript": "complete cleaned transcript",
  "technicalCorrectness": 0,
  "relevance": 0,
  "communication": 0,
  "structure": 0,
  "speakingBehavior": 0,
  "presentation": 0,
  "strengths": [],
  "weaknesses": [],
  "recommendations": [],
  "speechMetrics": {
    "pace": 0,
    "clarity": 0,
    "fillerWords": 0,
    "confidence": 0
  },
  "facialMetrics": {
    "eyeContact": 0,
    "facialExpression": 0,
    "attentiveness": 0
  },
  "feedback": "overall feedback",
  "questionFeedback": "feedback for this predefined question"
}

All numeric scores must be between 0 and 100.
Speaking requirements:
- Use clear, natural Indian English in questionFeedback and feedback.
- Keep feedback easy to understand when spoken aloud.
- Avoid American slang and complex words.
- Keep any suggested follow-up question short and TTS-friendly.
`;

const result = await sendVideoToGemini({
  filePath,
  mimeType,
  prompt,
  timeout: 120000,
  interviewId,
  userId,
  answerId,
  requestType: "video_analysis",
});

  logger.info('Detailed Gemini analysis completed', {
    question,
    technicalCorrectness: result.technicalCorrectness,
    relevance: result.relevance,
    communication: result.communication,
    structure: result.structure,
    speakingBehavior: result.speakingBehavior,
    presentation: result.presentation,
    speechMetrics: result.speechMetrics,
    facialMetrics: result.facialMetrics,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    recommendations: result.recommendations,
    feedback: result.feedback,
  });

  return result;
}

module.exports = {
  evaluateAnswer,
  evaluateAudioAnswer,
  evaluateTranscript,
  analyze,
  transcribeAudio,
};
