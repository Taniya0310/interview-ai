import { adminRequest } from "./adminapi";

export function getDashboardData() {
  return adminRequest("/dashboard");
}
