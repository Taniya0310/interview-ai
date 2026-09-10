const express = require("express");

const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
  previewBulkQuestions,
} = require("../controllers/adminQuestionController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getQuestions);

router.post("/", requireAdmin, createQuestion);

router.post(
  "/bulk-preview",
  requireAdmin,
  upload.single("file"),
  previewBulkQuestions,
);

router.post(
  "/bulk-upload",
  requireAdmin,
  upload.single("file"),
  bulkUploadQuestions,
);

router.patch("/:id", requireAdmin, updateQuestion);

router.delete("/:id", requireAdmin, deleteQuestion);

module.exports = router;