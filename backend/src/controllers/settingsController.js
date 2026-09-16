const settingsService = require("../services/settingsService");

async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
};