const pool = require("../config/database");

async function listCategories() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    FROM training_categories
    WHERE is_active = TRUE
    ORDER BY name ASC
  `);

  return result.rows;
}

async function createCategory(name, description) {
  const cleanName = name?.trim();

  if (!cleanName) {
    throw new Error("Category name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO training_categories (
      name,
      description,
      is_active
    )
    VALUES ($1, $2, TRUE)
    RETURNING *
    `,
    [cleanName, description?.trim() || null]
  );

  return result.rows[0];
}

async function updateCategory(
  id,
  name,
  description,
  isActive
) {
  const cleanName = name?.trim();

  if (!cleanName) {
    throw new Error("Category name is required");
  }

  const result = await pool.query(
    `
    UPDATE training_categories
    SET
      name = $2,
      description = $3,
      is_active = $4,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      cleanName,
      description?.trim() || null,
      isActive !== false,
    ]
  );

  return result.rows[0] || null;
}

async function deleteCategory(id) {
  const result = await pool.query(
    `
    UPDATE training_categories
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};