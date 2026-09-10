const express = require("express");

const {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
} = require("../controllers/adminDomainController");

const {
  requireAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", requireAdmin, getDomains);
router.post("/", requireAdmin, createDomain);
router.patch("/:id", requireAdmin, updateDomain);
router.delete("/:id", requireAdmin, deleteDomain);

module.exports = router;