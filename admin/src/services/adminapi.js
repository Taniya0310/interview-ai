const API_URL =
  import.meta.env.VITE_ADMIN_API_URL ||
  "http://localhost:5001/api/admin";

export async function adminRequest(path, options = {}) {
  const token = localStorage.getItem("adminToken");

  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData
        ? {}
        : { "Content-Type": "application/json" }),

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }

    throw new Error(
      data.message || "Admin request failed"
    );
  }

  return data;
}

export async function getQuestions() {
  const data = await adminRequest("/questions");
  return data.questions || [];
}

export async function createQuestion(question) {
  const data = await adminRequest("/questions", {
    method: "POST",
    body: JSON.stringify(question),
  });

  return data.question;
}

export async function updateQuestion(id, question) {
  const data = await adminRequest(
    `/questions/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(question),
    }
  );

  return data.question;
}

export async function deleteQuestion(id) {
  return adminRequest(`/questions/${id}`, {
    method: "DELETE",
  });
}