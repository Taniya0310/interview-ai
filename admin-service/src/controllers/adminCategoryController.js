const categoryService = require("../services/categoryManagementService");

async function getCategories(req, res) {
  try {
    const categories =
      await categoryService.listCategories();

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      message: error.message || "Failed to load categories",
    });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const category =
      await categoryService.createCategory(
        name.trim(),
        description?.trim() || null
      );

    res.status(201).json({ category });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This category already exists",
      });
    }

    res.status(500).json({
      message: error.message || "Failed to create category",
    });
  }
}

async function updateCategory(req, res) {
  try {
    const {
      name,
      description,
      isActive,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const category =
      await categoryService.updateCategory(
        req.params.id,
        name.trim(),
        description?.trim() || null,
        isActive !== false
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({ category });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This category already exists",
      });
    }

    res.status(500).json({
      message: error.message || "Failed to update category",
    });
  }
}

async function deleteCategory(req, res) {
  try {
    const category =
      await categoryService.deleteCategory(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({
      message: "Category deleted successfully",
      category,
    });
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      message: error.message || "Failed to delete category",
    });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};