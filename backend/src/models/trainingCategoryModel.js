const db = require("../config/database");

async function findAllActive() {
  const result = await db.query(
    `
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
    `
  );

  return result.rows;
}

async function findAll() {
  const result = await db.query(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM training_categories
      ORDER BY name ASC
    `
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.query(
    `
      SELECT
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      FROM training_categories
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function create(name, description) {
  const result = await db.query(
    `
      INSERT INTO training_categories (
        name,
        description
      )
      VALUES ($1, $2)
      RETURNING
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [name, description || null]
  );

  return result.rows[0];
}

async function update(id, name, description, isActive) {
  const result = await db.query(
    `
      UPDATE training_categories
      SET
        name = $2,
        description = $3,
        is_active = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [
      id,
      name,
      description || null,
      isActive
    ]
  );

  return result.rows[0] || null;
}

async function deactivate(id) {
  const result = await db.query(
    `
      UPDATE training_categories
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  findAllActive,
  findAll,
  findById,
  create,
  update,
  deactivate
};