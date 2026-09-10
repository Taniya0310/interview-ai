const express = require("express");

const {
  getAdminDashboard,
} = require("../controllers/adminDashboardController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getAdminDashboard);

module.exports = router;