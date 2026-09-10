const userManagementService = require("../services/userManagementService");

async function getUsers(req, res) {
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
      await userManagementService.listUsers({
        page,
        limit,
      });

    res.json(result);
  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      message: "Failed to load users",
    });
  }
}

async function getUserById(req, res) {
  try {
    const user =
      await userManagementService.getUserById(
        req.params.id,
      );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Admin user details error:", error);

    res.status(500).json({
      message: "Failed to load user",
    });
  }
}

module.exports = {
  getUsers,
  getUserById,
};