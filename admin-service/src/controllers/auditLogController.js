const auditLogService = require("../services/auditLogService");

async function getAuditLogs(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await auditLogService.listAuditLogs({
      page,
      limit,
      action: req.query.action || null,
      entityType: req.query.entity_type || null,
    });

    res.json(result);
  } catch (error) {
    console.error("Audit logs error:", error);

    res.status(500).json({
      message: "Failed to load audit logs",
    });
  }
}

module.exports = {
  getAuditLogs,
};