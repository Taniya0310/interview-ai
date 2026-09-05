import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate
} from "react-router-dom";

export default function GoogleCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState(
    "Processing Google login..."
  );

  useEffect(() => {
    console.log(
      "[GOOGLE CALLBACK] Loaded:",
      window.location.href
    );

    const params = new URLSearchParams(
      location.search
    );

    const accessToken =
      params.get("accessToken");

    const refreshToken =
      params.get("refreshToken");

    console.log(
      "[GOOGLE CALLBACK] Access token:",
      Boolean(accessToken)
    );

    console.log(
      "[GOOGLE CALLBACK] Refresh token:",
      Boolean(refreshToken)
    );

    if (!accessToken || !refreshToken) {
      console.error(
        "[GOOGLE CALLBACK] Tokens are missing"
      );

      setStatus(
        "Google login failed. Tokens are missing."
      );

      return;
    }

    const authData = {
      accessToken,
      refreshToken,
      user: {
        email: "google-user"
      }
    };

    localStorage.setItem(
      "authData",
      JSON.stringify(authData)
    );

    const savedAuth =
      localStorage.getItem("authData");

    console.log(
      "[GOOGLE CALLBACK] Auth data saved:",
      Boolean(savedAuth)
    );

    if (!savedAuth) {
      setStatus(
        "Google login failed. Could not save login data."
      );

      return;
    }

    setStatus(
      "Login successful. Redirecting..."
    );

    console.log(
      "[GOOGLE CALLBACK] Redirecting to dashboard"
    );

    setTimeout(() => {
      navigate("/dashboard", {
        replace: true
      });
    }, 300);
  }, [location.search, navigate]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h2>Google Login</h2>
        <p>{status}</p>
      </section>
    </main>
  );
}