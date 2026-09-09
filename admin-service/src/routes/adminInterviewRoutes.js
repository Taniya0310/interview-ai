const express = require("express");

const {
  getInterviews,
  getInterviewById,
} = require("../controllers/adminInterviewController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getInterviews);

router.get("/:id", requireAdmin, getInterviewById);

module.exports = router;