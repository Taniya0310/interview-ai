import { adminRequest } from "./adminapi";

export function getUsers() {
  return adminRequest("/users");
}