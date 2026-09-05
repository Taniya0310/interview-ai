const jwt = require("jsonwebtoken");
const { jwtAccessSecret } =
  require("../config/env");

async function authMiddleware(req, res, next) {
  try {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const token =
      authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: "Access token missing"
      });
    }

    const payload = jwt.verify(
      token,
      jwtAccessSecret
    );

    req.user = {
      id: payload.id,
      userId: payload.userId,
      email: payload.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired access token"
    });
  }
}

module.exports = authMiddleware;