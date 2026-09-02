const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userModel =
  require("../models/userModel");

const otpModel =
  require("../models/otpModel");

const refreshTokenModel =
  require("../models/refreshTokenModel");

const generateOtp =
  require("../utils/generateOtp");

const {
  jwtAccessSecret,
  jwtRefreshSecret,
  accessTokenExpiresIn,
  refreshTokenDays
} = require("../config/env");

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

async function requestEmailOtp(email) {
  const cleanEmail =
    email.toLowerCase().trim();

  if (
    !cleanEmail ||
    !cleanEmail.includes("@")
  ) {
    throw new Error(
      "A valid email address is required"
    );
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await otpModel.saveOtp(
    cleanEmail,
    otpHash,
    expiresAt
  );

  console.log(
    `[AUTH] OTP for ${cleanEmail}: ${otp}`
  );

  return {
    message: "OTP generated successfully"
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

module.exports = {
  requestEmailOtp,
  verifyEmailOtp
};