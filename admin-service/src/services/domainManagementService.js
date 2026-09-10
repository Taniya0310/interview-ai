const pool = require("../config/database");

async function listDomains() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    FROM domains
    WHERE is_active = TRUE
    ORDER BY name ASC
  `);

  return result.rows;
}

async function createDomain(name, description) {
  const cleanName = name?.trim();

  if (!cleanName) {
    throw new Error("Domain name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO domains (name, description)
    VALUES ($1, $2)
    RETURNING *
    `,
    [cleanName, description?.trim() || null]
  );

  return result.rows[0];
}

async function updateDomain(id, name, description) {
  const cleanName = name?.trim();

  if (!cleanName) {
    throw new Error("Domain name is required");
  }

  const result = await pool.query(
    `
    UPDATE domains
    SET
      name = $2,
      description = $3,
      updated_at = NOW()
    WHERE id = $1
      AND is_active = TRUE
    RETURNING *
    `,
    [id, cleanName, description?.trim() || null]
  );

  return result.rows[0] || null;
}

async function deleteDomain(id) {
  const result = await pool.query(
    `
    UPDATE domains
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1
      AND is_active = TRUE
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  listDomains,
  createDomain,
  updateDomain,
  deleteDomain,
};