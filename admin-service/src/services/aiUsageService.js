const pool = require("../config/database");

async function getSummary(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.from) {
    values.push(filters.from);
    conditions.push(`a.created_at >= $${values.length}`);
  }

  if (filters.to) {
    values.push(filters.to);
    conditions.push(`a.created_at <= $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`a.status = $${values.length}`);
  }

  if (filters.requestType) {
    values.push(filters.requestType);
    conditions.push(`a.request_type = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total_requests,
      COALESCE(SUM(a.prompt_tokens), 0)::int AS prompt_tokens,
      COALESCE(SUM(a.output_tokens), 0)::int AS output_tokens,
      COALESCE(SUM(a.total_tokens), 0)::int AS total_tokens,
      COALESCE(SUM(a.estimated_cost), 0)::numeric AS estimated_cost,
      COUNT(*) FILTER (
        WHERE a.status = 'failed'
      )::int AS failed_requests
    FROM ai_usage_logs a
    ${whereClause}
    `,
    values,
  );

  return result.rows[0];
}

async function getLogs(filters = {}) {
  const values = [];
  const conditions = [];

  if (filters.interviewId) {
    values.push(filters.interviewId);
    conditions.push(`a.interview_id = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`a.status = $${values.length}`);
  }

  if (filters.requestType) {
    values.push(filters.requestType);
    conditions.push(`a.request_type = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query(
    `
    SELECT
      a.id,
      a.interview_id,
      a.user_id,
      a.answer_id,
      a.request_type,
      a.provider,
      a.model,
      a.prompt_tokens,
      a.output_tokens,
      a.total_tokens,
      a.estimated_cost,
      a.status,
      a.error_message,
      a.latency_ms,
      a.created_at,
      a.completed_at,
      i.interview_type,
      i.role
    FROM ai_usage_logs a
    LEFT JOIN interviews i
      ON i.id = a.interview_id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT 500
    `,
    values,
  );

  return result.rows;
}

module.exports = {
  getSummary,
  getLogs,
};