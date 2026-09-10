const pool = require("../config/database");

async function createAuditLog({
  adminId = null,
  action,
  entityType,
  entityId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
}) {
  await pool.query(
    `
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      adminId,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
      ipAddress,
      userAgent,
    ]
  );
}

async function listAuditLogs({
  page = 1,
  limit = 20,
  action = null,
  entityType = null,
}) {
  const offset = (page - 1) * limit;

  const values = [];
  const conditions = [];

  if (action) {
    values.push(action);
    conditions.push(`action = $${values.length}`);
  }

  if (entityType) {
    values.push(entityType);
    conditions.push(`entity_type = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::INTEGER AS total
    FROM admin_audit_logs
    ${whereClause}
    `,
    values
  );

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `
    SELECT *
    FROM admin_audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${values.length - 1}
    OFFSET $${values.length}
    `,
    values
  );

  const total = countResult.rows[0].total;

  return {
    logs: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createAuditLog,
  listAuditLogs,
};