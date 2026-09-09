import { useRef, useState } from "react";
import {
  useLocation,
  useNavigate
} from "react-router-dom";

import { verifyOtp } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || "";
  const otpRefs = useRef([]);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOtpChange(index, value) {
    const digits = value.replace(/\D/g, "");

    if (digits.length > 1) {
      const pastedOtp = digits.slice(0, 6);
      setOtp(pastedOtp);

      otpRefs.current[
        Math.min(pastedOtp.length, 5)
      ]?.focus();

      return;
    }

    const nextOtp = otp.split("");
    nextOtp[index] = digits;

    setOtp(nextOtp.join("").slice(0, 6));

    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(event) {
  event.preventDefault();
  setError("");

  if (otp.length !== 6) {
    setError("Please enter the six-digit OTP.");
    return;
  }

  try {
    setLoading(true);

    const result = await verifyOtp(email, otp);

    login(result);

    const hasSeenLanding =
      localStorage.getItem("hasSeenLanding") === "true";

    navigate(
      hasSeenLanding
        ? "/dashboard"
        : "/",
      {
        replace: true
      }
    );
  } catch (requestError) {
    setError(
      requestError.message ||
        "Invalid or expired OTP."
    );
  } finally {
    setLoading(false);
  }
}

  if (!email) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="eyebrow">SkillzageAI</p>

          <h1>Email required</h1>

          <p>
            Please return to login and enter
            your email.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
          <p className="eyebrow">SkillzageAI</p>

        <h1>Verify your email</h1>

        <p>
          Enter the six-digit OTP sent to:
          <br />
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="otp-0">
            Verification code
          </label>

          <div
            className="otp-inputs"
            role="group"
            aria-label="Six-digit verification code"
          >
            {Array.from(
              { length: 6 },
              (_, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    otpRefs.current[index] =
                      element;
                  }}
                  id={`otp-${index}`}
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={index === 0 ? 6 : 1}
                  value={otp[index] || ""}
                  onChange={(event) =>
                    handleOtpChange(
                      index,
                      event.target.value
                    )
                  }
                  onKeyDown={(event) =>
                    handleOtpKeyDown(
                      index,
                      event
                    )
                  }
                  aria-label={`OTP digit ${
                    index + 1
                  }`}
                  required
                />
              )
            )}
          </div>

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
              ? "Verifying..."
              : "Verify OTP"}
          </button>
        </form>

        <button
          type="button"
          className="auth-link"
          onClick={() => navigate("/login")}
        >
          Use a different email
        </button>
      </section>
    </main>
  );
}
