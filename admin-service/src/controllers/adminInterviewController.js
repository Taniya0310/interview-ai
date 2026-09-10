const interviewManagementService = require("../services/interviewManagementService");

async function getInterviews(req, res) {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1,
      ),
      100,
    );

    const result =
      await interviewManagementService.listInterviews({
        page,
        limit,
      });

    res.json(result);
  } catch (error) {
    console.error("Admin interviews error:", error);

    res.status(500).json({
      message: "Failed to load interviews",
    });
  }
}

async function getInterviewById(req, res) {
  try {
    const interview =
      await interviewManagementService.findInterviewById(
        req.params.id,
      );

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    res.json({
      interview,
    });
  } catch (error) {
    console.error("Admin interview details error:", error);

    res.status(500).json({
      message: "Failed to load interview",
    });
  }
}

module.exports = {
  getInterviews,
  getInterviewById,
};