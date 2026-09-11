const adminSettingsService = require("../services/adminSettingsService");

async function getSettings(req, res) {
  try {
    const settings =
      await adminSettingsService.getSettings();

    res.json({ settings });
  } catch (error) {
    console.error("Get admin settings error:", error);

    res.status(500).json({
      message: "Failed to load settings",
    });
  }
}

async function updateSettings(req, res) {
  try {
    const updatedBy =
      req.admin?.email ||
      req.admin?.id ||
      "admin";

    const settings =
      await adminSettingsService.updateSettings(
        req.body.settings || req.body,
        updatedBy
      );

    res.json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update admin settings error:", error);

    res.status(400).json({
      message: error.message || "Failed to update settings",
    });
  }
}

module.exports = {
  getSettings,
  updateSettings,
};