const express = require("express");

const {
  summary,
  logs,
} = require("../controllers/aiUsageController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/summary", requireAdmin, summary);
router.get("/logs", requireAdmin, logs);

module.exports = router;