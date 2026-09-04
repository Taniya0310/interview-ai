require("dotenv").config();

module.exports = {
  port: Number(
    process.env.PORT || 4000
  ),

  databaseUrl:
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/interviewai",

  geminiApiKey:
    process.env.GEMINI_API_KEY || "",
googleClientId:
  process.env.GOOGLE_CLIENT_ID || "",

googleClientSecret:
  process.env.GOOGLE_CLIENT_SECRET || "",

googleRedirectUri:
  process.env.GOOGLE_REDIRECT_URI || "",

frontendUrl:
  process.env.FRONTEND_URL || "http://localhost",
    tenantId:
  process.env.TENANT_ID || "",

clientId:
  process.env.CLIENT_ID || "",

clientSecret:
  process.env.CLIENT_SECRET || "",

mailbox:
  process.env.MAILBOX || "",
  geminiModel:
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash",

  uploadDir:
    process.env.UPLOAD_DIR ||
    require("path").join(
      __dirname,
      "..",
      "..",
      "uploads"
    ),

  maxVideoBytes: Number(
    process.env.MAX_VIDEO_BYTES ||
    262144000
  ),

  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET,

  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET,

  accessTokenExpiresIn:
    process.env.ACCESS_TOKEN_EXPIRES_IN ||
    "15m",

  refreshTokenDays: Number(
    process.env.REFRESH_TOKEN_DAYS || 30
  )
};