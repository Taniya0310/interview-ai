const fs = require('fs');

const {
  geminiApiKey,
  geminiModel,
} = require('../config/env');

const logger = require('../utils/logger');

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
}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const videoBuffer = fs.readFileSync(filePath);
  const videoBase64 = videoBuffer.toString('base64');

  logger.info('Sending video to Gemini', {
    filePath,
    mimeType,
    bytes: videoBuffer.length,
    model: geminiModel,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
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

  if (!response.ok) {
    const errorBody = await response.text();

    logger.error('Gemini request failed', {
      status: response.status,
      body: errorBody,
    });

    const error = new Error(
      `Gemini request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const parsed = parseGeminiJson(data);

  logger.info('Gemini response parsed', parsed);

  return parsed;
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
`;

  const result = await evaluateWithRetry({
    filePath,
    mimeType,
    prompt,
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

async function analyze({
  filePath,
  mimeType,
  question,
  expectedTopics,
  previousAnswers = [],
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
  "feedback": "overall feedback",
  "questionFeedback": "feedback for this predefined question"
}

All numeric scores must be between 0 and 100.
`;

  const result = await sendVideoToGemini({
    filePath,
    mimeType,
    prompt,
    timeout: 120000,
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
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    recommendations: result.recommendations,
    feedback: result.feedback,
  });

  return result;
}

module.exports = {
  evaluateAnswer,
  analyze,
};