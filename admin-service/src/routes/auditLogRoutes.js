const express = require("express");

const {
  getAuditLogs,
} = require("../controllers/auditLogController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getAuditLogs);

module.exports = router;