const aiUsageService = require("../services/aiUsageService");

async function summary(req, res) {
  try {
    const summary = await aiUsageService.getSummary({
      from: req.query.from,
      to: req.query.to,
      status: req.query.status,
      requestType: req.query.requestType,
    });

    res.json({ summary });
  } catch (error) {
    console.error("AI usage summary error:", error);

    res.status(500).json({
      message: "Failed to load AI usage summary",
    });
  }
}

async function logs(req, res) {
  try {
    const logs = await aiUsageService.getLogs({
      interviewId: req.query.interviewId,
      status: req.query.status,
      requestType: req.query.requestType,
    });

    res.json({ logs });
  } catch (error) {
    console.error("AI usage logs error:", error);

    res.status(500).json({
      message: "Failed to load AI usage logs",
    });
  }
}

module.exports = {
  summary,
  logs,
};