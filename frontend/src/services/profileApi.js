import { authenticatedFetch } from "./authApi";

async function getProfile() {
  return authenticatedFetch("/profile");
}

async function updateProfile(profileData) {
  return authenticatedFetch("/profile", {
    method: "PATCH",
    body: JSON.stringify(profileData)
  });
}

export {
  getProfile,
  updateProfile
};