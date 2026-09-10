const questionManagementService = require("../services/questionManagementService");

async function getQuestions(req, res) {
  try {
    const questions =
      await questionManagementService.listQuestions();

    res.json({ questions });
  } catch (error) {
    console.error("Admin questions error:", error);

    res.status(500).json({
      message: "Failed to load questions",
    });
  }
}

async function createQuestion(req, res) {
  try {
    const question =
      await questionManagementService.createQuestion(
        req.body
      );

    res.status(201).json({ question });
  } catch (error) {
    console.error("Create question error:", error);

    res.status(500).json({
      message: "Failed to create question",
    });
  }
}

async function bulkUploadQuestions(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "CSV file is required",
      });
    }

    const result =
      await questionManagementService.bulkUploadQuestions({
        fileBuffer: req.file.buffer,
        interviewType: req.body.interview_type,
        difficulty: req.body.difficulty,
        role: req.body.role,
        domainId: req.body.domain_id,
        categoryId: req.body.category_id,
      });

    res.status(201).json(result);
  } catch (error) {
    console.error("Bulk question upload error:", error);

    res.status(error.statusCode || 400).json({
      message: error.message || "Bulk upload failed",
      row: error.row || null,
    });
  }
}

async function updateQuestion(req, res) {
  try {
    const question =
      await questionManagementService.updateQuestion(
        req.params.id,
        req.body
      );

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.json({ question });
  } catch (error) {
    console.error("Update question error:", error);

    res.status(500).json({
      message: "Failed to update question",
    });
  }
}

async function deleteQuestion(req, res) {
  try {
    const question =
      await questionManagementService.deactivateQuestion(
        req.params.id
      );

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.json({
      message: "Question deactivated",
      question,
    });
  } catch (error) {
    console.error("Delete question error:", error);

    res.status(500).json({
      message: "Failed to deactivate question",
    });
  }
}

module.exports = {
  getQuestions,
  createQuestion,
  bulkUploadQuestions,
  updateQuestion,
  deleteQuestion,
};