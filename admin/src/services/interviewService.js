import { adminRequest } from "./adminapi";

export function getInterviews() {
  return adminRequest("/interviews");
}

export function getInterviewById(id) {
  return adminRequest(`/interviews/${id}`);
}