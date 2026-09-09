import { adminRequest } from "./adminapi";

export async function getCategories() {
  const data = await adminRequest("/categories");

  return (data.categories || []).filter(
    (category) => category.is_active !== false
  );
}

export function createCategory(data) {
  return adminRequest("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id, data) {
  return adminRequest(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id) {
  return adminRequest(`/categories/${id}`, {
    method: "DELETE",
  });
}