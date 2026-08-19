const fs = require('fs');
const { geminiApiKey, geminiModel } = require('../config/env');
const logger = require('../utils/logger');

async function analyze({ filePath, mimeType, question, expectedTopics }) {
  logger.info('Gemini analysis started', { filePath, mimeType, question });
  if (!geminiApiKey) {
    return {
      needsFollowUp: false,
      followUpQuestion: null,
      technicalCorrectness: 0,
      relevance: 0,
      communication: 0,
      structure: 0,
      speakingBehavior: 0,
      presentation: 0,
      feedback: 'Gemini is not configured',
    };
  }

  const prompt = `You are an adaptive interview evaluator. Analyze the attached video answer.
Question: ${question}
Expected topics: ${JSON.stringify(expectedTopics || [])}

Decide whether the answer is satisfactory, relevant, coherent, and technically sufficient.
Return ONLY valid JSON with needsFollowUp (boolean), followUpQuestion (string or null),
numeric 0-100 fields technicalCorrectness, relevance, communication, structure,
speakingBehavior, presentation, arrays strengths, weaknesses, recommendations,
object speechMetrics, and strings feedback and questionFeedback.`;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const videoBuffer = fs.readFileSync(filePath);
  const videoBase64 = videoBuffer.toString('base64');
  logger.info('Gemini video prepared', {
    bytes: videoBuffer.length,
    base64Bytes: videoBase64.length,
    model: geminiModel,
  });
  logger.info('Sending request to Gemini', { model: geminiModel });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: videoBase64 } },
          ],
        }],
      }),
      signal: AbortSignal.timeout(120000),
    }
  );

  logger.info('Gemini response received', { status: response.status });
  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Gemini request failed', { status: response.status, model: geminiModel, body: errorBody });
    throw new Error(`Gemini request failed (${response.status}): ${errorBody}`);
  }
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text
    .replace(/```json|```/g, '')
    .trim();
  const parsed = JSON.parse(text);
  logger.info('Gemini JSON parsed', { needsFollowUp: parsed.needsFollowUp });
  return parsed;
}

module.exports = { analyze };
