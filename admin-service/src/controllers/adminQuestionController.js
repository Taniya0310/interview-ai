const questionManagementService = require("../services/questionManagementService");
const auditLogService = require("../services/auditLogService");

function getAdminId(req) {
  return req.admin?.id || req.user?.id || null;
}

function getRequestDetails(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  };
}
async function previewBulkQuestions(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "CSV file is required",
      });
    }

    const preview =
      await questionManagementService.previewBulkQuestions(
        req.file.buffer,
      );

    res.json(preview);
  } catch (error) {
    console.error(
      "Bulk question preview error:",
      error,
    );

    res.status(error.statusCode || 400).json({
      message:
        error.message || "Bulk preview failed",
    });
  }
}
async function getQuestions(req, res) {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 20,
        1,
      ),
      100,
    );

    const result =
      await questionManagementService.listQuestions({
        page,
        limit,
      });

    res.json(result);
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

    await auditLogService.createAuditLog({
      adminId: getAdminId(req),
      action: "CREATE",
      entityType: "question",
      entityId: question.id,
      details: {
        text: question.text,
      },
      ...getRequestDetails(req),
    });

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

    await auditLogService.createAuditLog({
      adminId: getAdminId(req),
      action: "BULK_UPLOAD",
      entityType: "question",
      details: {
        fileName: req.file.originalname,
        insertedCount: result.insertedCount,
      },
      ...getRequestDetails(req),
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

    await auditLogService.createAuditLog({
      adminId: getAdminId(req),
      action: "UPDATE",
      entityType: "question",
      entityId: question.id,
      details: {
        updatedFields: Object.keys(req.body),
      },
      ...getRequestDetails(req),
    });

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

    await auditLogService.createAuditLog({
      adminId: getAdminId(req),
      action: "DELETE",
      entityType: "question",
      entityId: question.id,
      details: {
        text: question.text,
      },
      ...getRequestDetails(req),
    });

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
  previewBulkQuestions,
};