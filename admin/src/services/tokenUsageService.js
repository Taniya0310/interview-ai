import { adminRequest } from "./adminapi";

export function getTokenUsageSummary(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return adminRequest(
    `/ai-usage/summary?${params.toString()}`,
  );
}

export function getTokenUsageLogs(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return adminRequest(
    `/ai-usage/logs?${params.toString()}`,
  );
}