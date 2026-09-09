require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./config/database");

const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminQuestionRoutes = require("./routes/adminQuestionRoutes");
const adminInterviewRoutes = require("./routes/adminInterviewRoutes");
const adminDomainRoutes = require("./routes/adminDomainRoutes");
const adminCategoryRoutes = require("./routes/adminCategoryRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
  })
);

// Body parser must come before all routes
app.use(express.json());

app.use(
  "/api/admin/auth",
  adminAuthRoutes
);

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

app.use(
  "/api/admin/users",
  adminUserRoutes
);

app.use(
  "/api/admin/questions",
  adminQuestionRoutes
);

app.use(
  "/api/admin/interviews",
  adminInterviewRoutes
);

app.use(
  "/api/admin/domains",
  adminDomainRoutes
);

app.use(
  "/api/admin/categories",
  adminCategoryRoutes
);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      service: "admin-service",
      database: "connected",
      status: "ok",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(500).json({
      service: "admin-service",
      database: "disconnected",
      status: "error",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Admin service running on port ${PORT}`
  );
});