const express = require("express");

const {
  getSettings,
  updateSettings,
} = require("../controllers/adminSettingsController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getSettings);
router.patch("/", requireAdmin, updateSettings);

module.exports = router;