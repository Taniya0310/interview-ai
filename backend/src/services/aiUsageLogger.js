const db = require("../config/database");

async function recordGeminiUsage({
  interviewId = null,
  userId = null,
  answerId = null,
  requestType,
  model,
  usageMetadata = {},
  status = "success",
  errorMessage = null,
  latencyMs = null,
}) {
  const promptTokens = Number(
    usageMetadata.promptTokenCount || 0
  );

  const outputTokens = Number(
    usageMetadata.candidatesTokenCount || 0
  );

  const totalTokens = Number(
    usageMetadata.totalTokenCount ||
      promptTokens + outputTokens
  );

  console.log("[GEMINI USAGE] Saving log:", {
    interviewId,
    userId,
    answerId,
    requestType,
    model,
    promptTokens,
    outputTokens,
    totalTokens,
    status,
  });

  try {
   const result = await db.query(
  `
  INSERT INTO ai_usage_logs (
    interview_id,
    user_id,
    answer_id,
    request_type,
    provider,
    model,
    prompt_tokens,
    output_tokens,
    total_tokens,
    status,
    error_message,
    latency_ms,
    completed_at
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13
  )
  RETURNING id
  `,
  [
    interviewId,
    userId,
    answerId,
    requestType,
    "gemini",
    model,
    promptTokens,
    outputTokens,
    totalTokens,
    status,
    errorMessage,
    latencyMs,
    new Date(),
  ]
);

    console.log("[GEMINI USAGE] Log saved successfully:", {
      id: result.rows[0].id,
      requestType,
      totalTokens,
      status,
    });

    return result.rows[0];
  } catch (error) {
    console.error("[GEMINI USAGE] Database insert failed:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: "ai_usage_logs",
    });

    return null;
  }
}

module.exports = {
  recordGeminiUsage,
};