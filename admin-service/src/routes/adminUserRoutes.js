const express = require("express");

const {
  getUsers,
  getUserById,
} = require("../controllers/adminUserController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getUsers);

router.get("/:id", requireAdmin, getUserById);

module.exports = router;