const express = require("express");

const authMiddleware =
  require("../middleware/authMiddleware");

const uploadMiddleware =
  require("../middleware/uploadMiddleware");

const categoryController =
  require("../controllers/trainingCategoryController");

const trainingController =
  require("../controllers/trainingController");

const router = express.Router();

router.get(
  "/categories",
  authMiddleware,
  categoryController.getActiveCategories
);

router.get(
  "/categories/all",
  authMiddleware,
  categoryController.getAllCategories
);

router.post(
  "/categories",
  authMiddleware,
  categoryController.createCategory
);

router.put(
  "/categories/:id",
  authMiddleware,
  categoryController.updateCategory
);

router.delete(
  "/categories/:id",
  authMiddleware,
  categoryController.deleteCategory
);

router.get(
  "/questions",
  authMiddleware,
  trainingController.getQuestions
);

router.post(
  "/sessions",
  authMiddleware,
  trainingController.createSession
);

router.post(
  "/sessions/:id/answers",
  authMiddleware,
  uploadMiddleware.single("audio"),
  trainingController.submitAnswer
);

router.post(
  "/sessions/:id/complete",
  authMiddleware,
  trainingController.completeSession
);

module.exports = router;