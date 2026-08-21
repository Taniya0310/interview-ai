const API =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore invalid error response bodies.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default api;