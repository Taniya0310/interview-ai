const authService =
  require("../services/authService");

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
        email
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

module.exports = {
  sendOtp,
  verifyOtp
};