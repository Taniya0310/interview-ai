import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  authenticatedFetch
} from "../services/authApi";
const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function api(path, options = {}) {
  return authenticatedFetch(
    path,
    options
  );
}

function formatLabel(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function InterviewSetupPage() {
  const navigate = useNavigate();

  const [interviewType, setInterviewType] =
    useState("technical");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleStart(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    try {
      setLoading(true);

      sessionStorage.removeItem(
        "currentInterview"
      );

      sessionStorage.removeItem(
        "currentInterviewId"
      );

      sessionStorage.removeItem(
        "currentReport"
      );

      const interview = await api(
        "/interviews",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            interviewType,
          }),
        }
      );

      const interviewId =
        interview?.id ??
        interview?.interview_id ??
        interview?.interviewId;

      if (!interviewId) {
        throw new Error(
          "Interview was created but no interview ID was returned."
        );
      }

      sessionStorage.setItem(
        "currentInterview",
        JSON.stringify(interview)
      );

      sessionStorage.setItem(
        "currentInterviewId",
        String(interviewId)
      );

      navigate("/interview/device-check");
    } catch (requestError) {
      console.error(
        "Create interview error:",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to create the interview."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mobile-page interview-setup-page">
      <header className="setup-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">
            INTERVIEW AI
          </div>

          <h1>
            Set up your interview
          </h1>

          <p>
            Choose a category. All active questions
            from that category will be asked.
          </p>
        </div>
      </header>

      <form
        className="setup-form"
        onSubmit={handleStart}
      >
        <section className="setup-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 01
              </span>

              <h2>
                Interview category
              </h2>

              <p>
                Select the type of interview you want
                to practice.
              </p>
            </div>
          </div>

          <div className="setup-option-grid">
            <button
              type="button"
              className={
                interviewType === "technical"
                  ? "setup-option active"
                  : "setup-option"
              }
              onClick={() =>
                setInterviewType("technical")
              }
            >
              <span className="setup-option-icon">
                &lt;/&gt;
              </span>

              <span className="setup-option-content">
                <strong>
                  Technical
                </strong>

                <small>
                  Coding, systems, APIs, and
                  technical concepts
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType === "technical"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={
                interviewType === "non-technical"
                  ? "setup-option active"
                  : "setup-option"
              }
              onClick={() =>
                setInterviewType("non-technical")
              }
            >
              <span className="setup-option-icon">
                ◌
              </span>

              <span className="setup-option-content">
                <strong>
                  Non-Technical
                </strong>

                <small>
                  Introduction, communication,
                  teamwork, and workplace situations
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType === "non-technical"
                  ? "✓"
                  : ""}
              </span>
            </button>
          </div>
        </section>

        <section className="setup-summary">
          <div className="eyebrow">
            INTERVIEW SUMMARY
          </div>

          <div className="setup-summary-row">
            <span>
              Category
            </span>

            <strong>
              {formatLabel(interviewType)}
            </strong>
          </div>

          <div className="setup-summary-row">
            <span>
              Questions
            </span>

            <strong>
              All active questions
            </strong>
          </div>
        </section>

        {error && (
          <div className="form-error">
            <span>!</span>

            <p>
              {error}
            </p>
          </div>
        )}

        <section className="setup-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Creating Interview..."
              : "Start Interview"}

            <span>→</span>
          </button>

          <p>
            You will check your camera and microphone
            before the interview begins.
          </p>
        </section>
      </form>

      <button
        type="button"
        className="setup-admin-link"
        onClick={() =>
          navigate("/admin/questions")
        }
      >
        <span>
          Question Bank
        </span>

        <span>
          →
        </span>
      </button>

      <nav className="bottom-nav">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <span>⌂</span>
          <small>
            Home
          </small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/interview/history")
          }
        >
          <span>◷</span>
          <small>
            History
          </small>
        </button>

        <button
          type="button"
          className="bottom-nav-item active"
        >
          <span className="nav-plus">
            +
          </span>

          <small>
            Practice
          </small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/settings")
          }
        >
          <span>⚙</span>

          <small>
            Settings
          </small>
        </button>
      </nav>
    </main>
  );
}