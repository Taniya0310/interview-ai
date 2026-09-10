import { adminRequest } from "./adminapi";

export function getInterviews({
  page = 1,
  limit = 10,
} = {}) {
  return adminRequest(
    `/interviews?page=${page}&limit=${limit}`,
  );
}

export function getInterviewById(id) {
  return adminRequest(`/interviews/${id}`);
}