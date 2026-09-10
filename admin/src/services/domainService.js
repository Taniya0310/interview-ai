import { adminRequest } from "./adminapi";

export async function getDomains() {
  const data = await adminRequest("/domains");

  return Array.isArray(data)
    ? data
    : data?.domains || [];
}

export async function createDomain(domain) {
  return adminRequest("/domains", {
    method: "POST",
    body: JSON.stringify({
      name: domain.name.trim(),
      description: domain.description?.trim() || "",
    }),
  });
}
 
export async function updateDomain(id, domain) {
  return adminRequest(`/domains/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: domain.name.trim(),
      description: domain.description?.trim() || "",
    }),
  });
}

export async function deleteDomain(id) {
  return adminRequest(`/domains/${id}`, {
    method: "DELETE",
  });
}