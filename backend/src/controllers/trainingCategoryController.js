const categoryService =
  require("../services/trainingCategoryService");

async function getActiveCategories(
  req,
  res,
  next
) {
  try {
    const categories =
      await categoryService.getActiveCategories();

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

async function getAllCategories(
  req,
  res,
  next
) {
  try {
    const categories =
      await categoryService.getAllCategories();

    res.json(categories);
  } catch (error) {
    next(error);
  }
}

async function createCategory(
  req,
  res,
  next
) {
  try {
    const category =
      await categoryService.createCategory(
        req.body
      );

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

async function updateCategory(
  req,
  res,
  next
) {
  try {
    const category =
      await categoryService.updateCategory(
        req.params.id,
        req.body
      );

    res.json(category);
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(
  req,
  res,
  next
) {
  try {
    const category =
      await categoryService.deactivateCategory(
        req.params.id
      );

    res.json(category);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActiveCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};