const express = require("express");

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/adminCategoryController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getCategories);

router.post("/", requireAdmin, createCategory);

router.patch("/:id", requireAdmin, updateCategory);

router.delete("/:id", requireAdmin, deleteCategory);

module.exports = router;