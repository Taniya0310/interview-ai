const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes(
    "application/json"
  )
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data.error ||
          data.message ||
          "Request failed";

    throw new Error(message);
  }

  return data;
}

async function sendOtp(email) {
  const response = await fetch(
    `${API_BASE_URL}/auth/send-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase()
      })
    }
  );

  return parseResponse(response);
}

async function verifyOtp(email, otp) {
  const response = await fetch(
    `${API_BASE_URL}/auth/verify-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp
      })
    }
  );

  return parseResponse(response);
}

async function authenticatedFetch(
  endpoint,
  options = {}
) {
  const savedAuth =
    localStorage.getItem("authData");

  const auth = savedAuth
    ? JSON.parse(savedAuth)
    : null;

  const headers = {
    ...(options.headers || {})
  };

  const isFormData =
    options.body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] =
      "application/json";
  }

  if (auth?.accessToken) {
    headers.Authorization =
      `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  return parseResponse(response);
}

export {
  sendOtp,
  verifyOtp,
  authenticatedFetch
};