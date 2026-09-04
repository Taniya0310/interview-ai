const categoryModel = require("../models/trainingCategoryModel");

async function getActiveCategories() {
  return categoryModel.findAllActive();
}

async function getAllCategories() {
  return categoryModel.findAll();
}

async function createCategory(data = {}) {
  const name = String(data.name || "").trim();
  const description = String(data.description || "").trim();

  if (!name) {
    throw new Error("Category name is required");
  }

  return categoryModel.create(name, description);
}

async function updateCategory(id, data = {}) {
  const existingCategory = await categoryModel.findById(id);

  if (!existingCategory) {
    throw new Error("Training category not found");
  }

  const name = String(
    data.name ?? existingCategory.name
  ).trim();

  const description = String(
    data.description ??
      existingCategory.description ??
      ""
  ).trim();

  const isActive =
    data.isActive === undefined
      ? existingCategory.is_active
      : Boolean(data.isActive);

  if (!name) {
    throw new Error("Category name is required");
  }

  return categoryModel.update(
    id,
    name,
    description,
    isActive
  );
}

async function deactivateCategory(id) {
  const category = await categoryModel.deactivate(id);

  if (!category) {
    throw new Error("Training category not found");
  }

  return category;
}

module.exports = {
  getActiveCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deactivateCategory
};