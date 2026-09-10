import { adminRequest } from "./adminapi";

export async function loginAdmin(email, password) {
  const data = await adminRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem("adminToken", data.token);
  localStorage.setItem(
    "adminUser",
    JSON.stringify(data.admin)
  );

  return data;
}

export function logoutAdmin() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}

export function isAdminAuthenticated() {
  return Boolean(localStorage.getItem("adminToken"));
}

export function getAdminUser() {
  const value = localStorage.getItem("adminUser");
  return value ? JSON.parse(value) : null;
}