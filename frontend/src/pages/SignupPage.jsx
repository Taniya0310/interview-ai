import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../services/authApi";
import GoogleSignInButton
  from "../components/GoogleSignInButton";

export default function SignupPage() {
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

      await sendOtp(email, "signup");

      navigate("/verify-otp", {
        state: {
          email: email.trim().toLowerCase()
        }
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
      <section className="auth-card auth-card-signup">
        <div className="auth-brand" aria-label="SkillzageAI">
          <img src="/INSTAGRAM%20SKILLZAGE.png" alt="SkillzageAI" />
          <span>SkillzageAI</span>
        </div>

        <h1>Create your account</h1>

        <p>
          Sign up to start practicing interviews.
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
              : "Create account"}
          </button>
        </form>
<div className="auth-divider">
  <span>or</span>
</div>
        <GoogleSignInButton />

        <p className="auth-footer">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}
