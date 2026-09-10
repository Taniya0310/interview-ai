const API =
  import.meta.env.VITE_API_URL ||
  "http://13.234.2.94:4000/api";

export async function api(path, options = {}) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",

      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),

      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),

      ...(options.headers || {}),
    },
  });

  if (response.status === 304) {
    throw new Error(
      "The server returned cached results. Please try again."
    );
  }

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();

      message =
        data.message ||
        data.error ||
        `Request failed with status ${response.status}`;
    } catch {
      message = `Request failed with status ${response.status}`;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default api;