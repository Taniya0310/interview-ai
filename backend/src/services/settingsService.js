const db = require("../config/database");

const PUBLIC_SETTING_KEYS = [
  "minimum_passing_score",
  "follow_up_question_limit",
  "speech_speed",
  "speech_pitch",
  "speech_volume",
  "tts_chunk_size",
  "silence_timeout_ms",
  "interview_duration_minutes",
];

async function getSettings() {
  const result = await db.query(
    `SELECT setting_key, setting_value, value_type
     FROM app_settings
     WHERE setting_key = ANY($1::text[])`,
    [PUBLIC_SETTING_KEYS]
  );

  return result.rows.reduce((settings, row) => {
    settings[row.setting_key] =
      row.value_type === "number"
        ? Number(row.setting_value)
        : row.setting_value;

    return settings;
  }, {});
}

module.exports = {
  getSettings,
};