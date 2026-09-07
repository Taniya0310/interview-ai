const r = require("express").Router();
const authMiddleware =
  require("../middleware/authMiddleware");
const interviewController =
  require("../controllers/interviewController");

const answerController =
  require("../controllers/answerController");

const uploadMiddleware =
  require("../middleware/uploadMiddleware");

r.get(
  "/",
  interviewController.list
);

r.post(
  "/",
  interviewController.create
);

r.post(
  "/:id/heartbeat",
  interviewController.heartbeat
);

r.post(
  "/:id/quit",
  interviewController.quit
);

r.post(
  "/:id/finish",
  interviewController.finish
);

r.get(
  "/:id",
  interviewController.get
);

r.post(
  "/:interviewId/answers",
  uploadMiddleware.single("video"),
  answerController.create
);
r.get(
  "/streak",
  authMiddleware,
  interviewController.streak
);
module.exports = r;