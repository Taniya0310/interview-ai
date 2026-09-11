import { useEffect, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { sendOtp, verifyOtp } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

function getRemainingSeconds() {
  const expiresAt = localStorage.getItem("otpExpiresAt");

  if (!expiresAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / 1000,
    ),
  );
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || "";
  const mode = location.state?.mode || "login";

  const otpRefs = useRef([]);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] =
    useState(getRemainingSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

    if (remainingSeconds <= 0) {
      setError("Your OTP has expired. Please request a new OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the six-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyOtp(email, otp);

      localStorage.removeItem("otpExpiresAt");

      login(result);

      const hasSeenLanding =
        localStorage.getItem("hasSeenLanding") === "true";

      navigate(
        hasSeenLanding ? "/dashboard" : "/",
        {
          replace: true,
        },
      );
    } catch (requestError) {
      setError(
        requestError.message || "Invalid or expired OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setOtp("");

    try {
      setResending(true);

      const response = await sendOtp(email, mode);

      const expiresAt =
        response.expiresAt ||
        new Date(Date.now() + 10 * 60 * 1000).toISOString();

      localStorage.setItem("otpExpiresAt", expiresAt);

      setRemainingSeconds(
        Math.max(
          0,
          Math.ceil(
            (new Date(expiresAt).getTime() - Date.now()) /
              1000,
          ),
        ),
      );
    } catch (requestError) {
      setError(
        requestError.message || "Unable to resend OTP.",
      );
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="eyebrow">SkillzageAI</p>

          <h1>Email required</h1>

          <p>
            Please return to login and enter your email.
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

  const otpExpired = remainingSeconds <= 0;

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

        {!otpExpired ? (
          <p className="otp-expiry">
            OTP expires in{" "}
            <strong>
              {formatTimer(remainingSeconds)}
            </strong>
          </p>
        ) : (
          <p className="otp-expired">
            This OTP has expired. Please request a new one.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="otp-0">
            Verification code
          </label>

          <div
            className="otp-inputs"
            role="group"
            aria-label="Six-digit verification code"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <input
                key={index}
                ref={(element) => {
                  otpRefs.current[index] = element;
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
                    event.target.value,
                  )
                }
                onKeyDown={(event) =>
                  handleOtpKeyDown(index, event)
                }
                aria-label={`OTP digit ${index + 1}`}
                disabled={otpExpired}
                required
              />
            ))}
          </div>

          {error && (
            <p className="auth-error">{error}</p>
          )}

          {!otpExpired && (
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          )}
        </form>

        {otpExpired && (
          <button
            type="button"
            className="auth-link"
            onClick={handleResendOtp}
            disabled={resending}
          >
            {resending ? "Sending OTP..." : "Resend OTP"}
          </button>
        )}

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