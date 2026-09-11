const pool = require("../config/database");

const SETTING_DEFINITIONS = {
  minimum_passing_score: {
    type: "number",
    min: 0,
    max: 100,
  },

  follow_up_question_limit: {
    type: "number",
    min: 0,
    max: 10,
  },

  speech_speed: {
    type: "number",
    min: 0.5,
    max: 2,
  },

  speech_pitch: {
    type: "number",
    min: 0.5,
    max: 2,
  },

  speech_volume: {
    type: "number",
    min: 0,
    max: 1,
  },

  tts_chunk_size: {
    type: "number",
    min: 50,
    max: 500,
  },

  silence_timeout_ms: {
    type: "number",
    min: 1000,
    max: 30000,
  },

  interview_duration_minutes: {
    type: "number",
    min: 1,
    max: 180,
  },
};

function parseSetting(row) {
  if (row.value_type === "number") {
    return Number(row.setting_value);
  }

  if (row.value_type === "boolean") {
    return row.setting_value === "true";
  }

  return row.setting_value;
}

async function getSettings() {
  const result = await pool.query(
    `
    SELECT
      setting_key,
      setting_value,
      value_type,
      description,
      updated_by,
      updated_at
    FROM app_settings
    ORDER BY setting_key
    `
  );

  const settings = {};

  result.rows.forEach((row) => {
    settings[row.setting_key] = parseSetting(row);
  });

  return settings;
}

async function updateSettings(settings, updatedBy) {
  const entries = Object.entries(settings || {});

  if (entries.length === 0) {
    throw new Error("No settings were provided");
  }

  for (const [key, value] of entries) {
    const definition = SETTING_DEFINITIONS[key];

    if (!definition) {
      throw new Error(`Unknown setting: ${key}`);
    }

    const numericValue = Number(value);

    if (
      definition.type === "number" &&
      (!Number.isFinite(numericValue) ||
        numericValue < definition.min ||
        numericValue > definition.max)
    ) {
      throw new Error(
        `${key} must be between ${definition.min} and ${definition.max}`
      );
    }
  }

  for (const [key, value] of entries) {
    const definition = SETTING_DEFINITIONS[key];

    await pool.query(
      `
      INSERT INTO app_settings (
        setting_key,
        setting_value,
        value_type,
        updated_by,
        updated_at
      )
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key)
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        value_type = EXCLUDED.value_type,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        key,
        String(value),
        definition.type,
        updatedBy || null,
      ]
    );
  }

  return getSettings();
}

module.exports = {
  getSettings,
  updateSettings,
};