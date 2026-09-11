import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../services/authApi";
import GoogleSignInButton
  from "../components/GoogleSignInButton";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const normalizedEmail = email.trim().toLowerCase();

const response = await sendOtp(normalizedEmail, "login");

localStorage.setItem(
  "otpExpiresAt",
  response.expiresAt ||
    new Date(Date.now() + 10 * 60 * 1000).toISOString(),
);

navigate("/verify-otp", {
  state: {
    email: normalizedEmail,
    mode: "login",
  },
});
    } catch (requestError) {
      setError(
        requestError.message ||
        "Unable to send OTP."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-login">
        <div className="auth-brand" aria-label="SkillzageAI">
          <img src="/INSTAGRAM%20SKILLZAGE.png" alt="SkillzageAI" />
          <span>SkillzageAI</span>
        </div>

        <h1>Welcome back</h1>

        <p>
          Sign in to continue your interview practice.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending OTP..."
              : "Continue with Email"}
          </button>
        </form>
<div className="auth-divider">
  <span>or</span>
</div>
        <GoogleSignInButton />

        <p className="auth-footer">
          New here?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
          >
            Create an account
          </button>
        </p>
      </section>
    </main>
  );
}
