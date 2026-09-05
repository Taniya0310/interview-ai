const express = require("express");

const app = express();

// Request and response logging
app.use((req, res, next) => {
  console.log(
    `[REQUEST] ${req.method} ${req.path}`
  );

  res.on("finish", () => {
    console.log(
      `[RESPONSE] ${req.method} ${req.path} ${res.statusCode}`
    );
  });

  next();
});

const authMiddleware =
  require("./middleware/authMiddleware");

app.use(require("cors")());

app.use(
  express.json({
    limit: "2mb"
  })
);

app.get(
  "/health",
  (_, res) => {
    res.json({
      ok: true,
      service: "interview-api"
    });
  }
);

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);
app.use(
  "/api/training",
  require("./routes/trainingRoutes")
);
app.use(
  "/api/profile",
  authMiddleware,
  require("./routes/profileRoutes")
);

app.use(
  "/api/questions",
  require("./routes/questionRoutes")
);

app.use(
  "/api/interviews",
  authMiddleware,
  require("./routes/interviewRoutes")
);

app.use(
  "/api/analysis",
  require("./routes/analysisRoutes")
);

app.use(
  "/api",
  require("./routes/answerRoutes")
);

app.use(
  require("./middleware/errorMiddleware")
);

module.exports = app;