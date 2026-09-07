const authService =
  require("../services/authService");

const {
  frontendUrl
} = require("../config/env");

async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const result =
     await authService.requestEmailOtp(
  email,
  req.body.mode || "login"
);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        error: "Email and OTP are required"
      });
    }

    const result =
      await authService.verifyEmailOtp(
        email,
        otp
      );

    res.json({
      message: "Email verified successfully",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    next(error);
  }
}

function googleAuth(req, res, next) {
  try {
    const authUrl =
      authService.getGoogleAuthUrl();

    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

async function googleCallback(req, res, next) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        error: "Google authorization code is missing"
      });
    }

    const result =
      await authService.handleGoogleCallback(
        code
      );

    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });

    res.redirect(
      `${frontendUrl}/google-callback?${params.toString()}`
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  sendOtp,
  verifyOtp,
  googleAuth,
  googleCallback
};