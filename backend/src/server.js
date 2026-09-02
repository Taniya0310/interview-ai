const app = require("./app");
const { port } = require("./config/env");
const interviewService = require("./services/interviewService");

setInterval(async () => {
  try {
    const quitInterviews =
      await interviewService.quitStale();

    if (quitInterviews.length > 0) {
      console.log(
        "Marked stale interviews as quit:",
        quitInterviews.map((interview) => interview.id)
      );
    }
  } catch (error) {
    console.error(
      "Failed to update stale interviews:",
      error
    );
  }
}, 60 * 1000);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on ${port}`);
});