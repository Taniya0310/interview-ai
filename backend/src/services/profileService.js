const profileModel =
  require("../models/profileModel");

async function getProfile(userId) {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  let profile =
    await profileModel.findProfileByUserId(
      userId
    );

  if (!profile) {
    profile =
      await profileModel.createProfile(
        userId
      );
  }

  return profile;
}

async function updateProfile(
  userId,
  profileData
) {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  const fullName =
    typeof profileData.fullName === "string"
      ? profileData.fullName.trim()
      : "";

  const phoneNumber =
    typeof profileData.phoneNumber === "string"
      ? profileData.phoneNumber.trim()
      : "";

  const occupation =
    typeof profileData.occupation === "string"
      ? profileData.occupation.trim().toLowerCase()
      : "";

  const institutionCompany =
    typeof profileData.institutionCompany === "string"
      ? profileData.institutionCompany.trim()
      : "";

  if (fullName.length > 120) {
    throw new Error(
      "Full name must be 120 characters or less"
    );
  }

  if (phoneNumber.length > 30) {
    throw new Error(
      "Phone number must be 30 characters or less"
    );
  }

  if (
    occupation &&
    ![
      "student",
      "professional",
      "teacher"
    ].includes(occupation)
  ) {
    throw new Error(
      "Invalid occupation"
    );
  }

  if (institutionCompany.length > 150) {
    throw new Error(
      "Institution or company must be 150 characters or less"
    );
  }

  return profileModel.updateProfile(
    userId,
    fullName,
    phoneNumber,
    occupation,
    institutionCompany
  );
}

module.exports = {
  getProfile,
  updateProfile
};