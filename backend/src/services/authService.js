const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } =
  require("google-auth-library");

const userModel =
  require("../models/userModel");

const otpModel =
  require("../models/otpModel");

const refreshTokenModel =
  require("../models/refreshTokenModel");

const generateOtp =
  require("../utils/generateOtp");

const mailService =
  require("./mailService");

const {
  jwtAccessSecret,
  jwtRefreshSecret,
  accessTokenExpiresIn,
  refreshTokenDays,
  googleClientId,
  googleClientSecret,
  googleRedirectUri
} = require("../config/env");

const googleClient =
  new OAuth2Client(
    googleClientId,
    googleClientSecret,
    googleRedirectUri
  );

function hashValue(value) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function hashOtp(otp) {
  return hashValue(otp);
}

function createAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userId: user.user_id,
      email: user.email
    },
    jwtAccessSecret,
    {
      expiresIn: accessTokenExpiresIn
    }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userId: user.user_id,
      email: user.email
    },
    jwtRefreshSecret,
    {
      expiresIn: `${refreshTokenDays}d`
    }
  );
}

async function createSession(user) {
  const accessToken =
    createAccessToken(user);

  const refreshToken =
    createRefreshToken(user);

  const refreshTokenExpiresAt =
    new Date(
      Date.now() +
        refreshTokenDays *
          24 *
          60 *
          60 *
          1000
    );

  await refreshTokenModel.saveRefreshToken(
    user.id,
    hashValue(refreshToken),
    refreshTokenExpiresAt
  );

  return {
    user,
    accessToken,
    refreshToken
  };
}

async function requestEmailOtp(email, mode = "login") {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Valid email is required");
  }

  const existingUser =
    await userModel.findUserByEmail(cleanEmail);

  if (mode === "login" && !existingUser) {
    const error = new Error(
      "Account not found. Please sign up first."
    );
    error.statusCode = 404;
    throw error;
  }

  if (mode === "signup" && existingUser) {
    const error = new Error(
      "Account already exists. Please log in."
    );
    error.statusCode = 409;
    throw error;
  }

  // Only reach this point when OTP is allowed
  const otp = generateOtp();
  const otpHash = hashValue(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await otpModel.saveOtp(
    cleanEmail,
    otpHash,
    expiresAt
  );

  await mailService.sendOtpEmail(
    cleanEmail,
    otp
  );

  return {
  message: "OTP sent successfully",
  expiresAt: expiresAt.toISOString(),
  expiresInSeconds: 10 * 60,
};
}

async function verifyEmailOtp(email, otp) {
  const cleanEmail =
    email.toLowerCase().trim();

  const storedOtp =
    await otpModel.findValidOtp(
      cleanEmail
    );

  if (!storedOtp) {
    throw new Error(
      "OTP is invalid or expired"
    );
  }

  const providedHash = hashOtp(otp);

  if (
    providedHash !== storedOtp.otp_hash
  ) {
    await otpModel.incrementAttempts(
      storedOtp.id
    );

    throw new Error("Incorrect OTP");
  }

  let user =
    await userModel.findUserByEmail(
      cleanEmail
    );

  if (!user) {
    user = await userModel.createUser({
      email: cleanEmail,
      authProvider: "email"
    });
  }

  user =
    await userModel.markUserVerified(
      user.user_id
    );

  await otpModel.deleteOtp(
    storedOtp.id
  );

  return createSession(user);
}

function getGoogleAuthUrl() {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "email",
      "profile"
    ],
    prompt: "select_account"
  });
}

async function handleGoogleCallback(code) {
  const { tokens } =
    await googleClient.getToken(code);

  const ticket =
    await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId
    });

  const payload =
    ticket.getPayload();

  if (
    !payload ||
    !payload.email ||
    !payload.sub
  ) {
    throw new Error(
      "Invalid Google account"
    );
  }

  const email =
    payload.email.toLowerCase().trim();

  let user =
    await userModel.findUserByGoogleId(
      payload.sub
    );

  if (!user) {
    user =
      await userModel.findUserByEmail(
        email
      );
  }

  if (!user) {
    user = await userModel.createUser({
      email,
      googleId: payload.sub,
      authProvider: "google"
    });
  }

  user =
    await userModel.markUserVerified(
      user.user_id
    );

  return createSession(user);
}

module.exports = {
  requestEmailOtp,
  verifyEmailOtp,
  getGoogleAuthUrl,
  handleGoogleCallback
};