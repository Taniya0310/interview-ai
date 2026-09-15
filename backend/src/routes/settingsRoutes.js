const router = require("express").Router();

const settingsController = require("../controllers/settingsController");

router.get("/", settingsController.getSettings);

module.exports = router;