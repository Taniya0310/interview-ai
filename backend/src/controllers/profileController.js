const profileService =
  require("../services/profileService");

async function getProfile(req, res, next) {
  try {
    const userId =
      req.user.userId;

    const profile =
      await profileService.getProfile(
        userId
      );

    res.json(profile);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(
  req,
  res,
  next
) {
  try {
    const userId =
      req.user.userId;

    const profile =
      await profileService.updateProfile(
        userId,
        req.body
      );

    res.json(profile);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile
};