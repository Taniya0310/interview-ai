const express = require("express");

const authController =
  require("../controllers/authController");

const router = express.Router();

router.post(
  "/send-otp",
  authController.sendOtp
);

router.post(
  "/verify-otp",
  authController.verifyOtp
);

// Google OAuth routes
router.get(
  "/google",
  authController.googleAuth
);

router.get(
  "/google/callback",
  authController.googleCallback
);

module.exports = router;