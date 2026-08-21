import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function api(path, options = {}) {
  const response = await fetch(
    `${API}${path}`,
    options
  );

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message =
        data.error ||
        data.message ||
        message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
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

  const [role, setRole] =
    useState("backend-developer");

  const [difficulty, setDifficulty] =
    useState("beginner");

  const [questionCount, setQuestionCount] =
    useState(3);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleQuestionCountChange(
    event
  ) {
    const value = Number(
      event.target.value
    );

    if (!Number.isFinite(value)) {
      return;
    }

    setQuestionCount(
      Math.min(
        100,
        Math.max(1, value)
      )
    );
  }

  async function handleStart(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const count = Math.min(
      100,
      Math.max(
        1,
        Number(questionCount) || 3
      )
    );

    try {
      setLoading(true);

      /*
       * Start fresh.
       */
      sessionStorage.removeItem(
        "currentInterview"
      );

      sessionStorage.removeItem(
        "currentInterviewId"
      );

      sessionStorage.removeItem(
        "currentReport"
      );

      /*
       * Keep the request body compatible
       * with the existing interview API.
       */
      const interview =
        await api("/interviews", {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            interviewType,
            role,
            difficulty,
            questionCount: count,
          }),
        });

      const interviewId =
        interview?.id ??
        interview?.interview_id ??
        interview?.interviewId;

      if (!interviewId) {
        throw new Error(
          "Interview was created but no interview ID was returned."
        );
      }

      /*
       * Save the complete interview because
       * DeviceCheckPage and LiveInterviewPage
       * use it.
       */
      sessionStorage.setItem(
        "currentInterview",
        JSON.stringify(interview)
      );

      sessionStorage.setItem(
        "currentInterviewId",
        String(interviewId)
      );

      navigate(
        "/interview/device-check"
      );
    } catch (err) {
      console.error(
        "Create interview error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create the interview."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mobile-page interview-setup-page">
      {/* Header */}
      <header className="setup-header">
        <button
          type="button"
          className="back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
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
            Choose how you want your interview
            to feel. We'll take care of the rest.
          </p>
        </div>
      </header>

      <form
        className="setup-form"
        onSubmit={handleStart}
      >
        {/* Interview Type */}
        <section className="setup-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 01
              </span>

              <h2>
                Interview type
              </h2>

              <p>
                What would you like to
                practice?
              </p>
            </div>
          </div>

          <div className="setup-option-grid">
            <button
              type="button"
              className={
                interviewType ===
                "technical"
                  ? "setup-option active"
                  : "setup-option"
              }
              onClick={() =>
                setInterviewType(
                  "technical"
                )
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
                  Coding, systems & technical
                  concepts
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType ===
                  "technical"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={
                interviewType ===
                "behavioral"
                  ? "setup-option active"
                  : "setup-option"
              }
              onClick={() =>
                setInterviewType(
                  "behavioral"
                )
              }
            >
              <span className="setup-option-icon">
                ◌
              </span>

              <span className="setup-option-content">
                <strong>
                  Behavioral
                </strong>

                <small>
                  Communication & workplace
                  situations
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType ===
                  "behavioral"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={
                interviewType ===
                "mixed"
                  ? "setup-option active"
                  : "setup-option"
              }
              onClick={() =>
                setInterviewType(
                  "mixed"
                )
              }
            >
              <span className="setup-option-icon">
                ◈
              </span>

              <span className="setup-option-content">
                <strong>
                  Mixed
                </strong>

                <small>
                  Technical + behavioral
                  questions
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType ===
                  "mixed"
                  ? "✓"
                  : ""}
              </span>
            </button>
          </div>
        </section>

        {/* Role */}
        <section className="setup-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 02
              </span>

              <h2>
                Target role
              </h2>

              <p>
                What role are you preparing
                for?
              </p>
            </div>
          </div>

          <div className="setup-field">
            <label htmlFor="role">
              Role
            </label>

            <input
              id="role"
              type="text"
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value
                )
              }
              placeholder="e.g. Backend Developer"
              autoComplete="off"
            />

            <span className="field-hint">
              Use the role you're actually
              targeting.
            </span>
          </div>
        </section>

        {/* Difficulty */}
        <section className="setup-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 03
              </span>

              <h2>
                Difficulty
              </h2>

              <p>
                Choose the level that matches
                your current preparation.
              </p>
            </div>
          </div>

          <div className="difficulty-grid">
            <button
              type="button"
              className={
                difficulty ===
                "beginner"
                  ? "difficulty-option active"
                  : "difficulty-option"
              }
              onClick={() =>
                setDifficulty(
                  "beginner"
                )
              }
            >
              <strong>
                Beginner
              </strong>

              <small>
                Fundamentals & simple
                questions
              </small>

              <span>
                {difficulty ===
                  "beginner"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={
                difficulty ===
                "intermediate"
                  ? "difficulty-option active"
                  : "difficulty-option"
              }
              onClick={() =>
                setDifficulty(
                  "intermediate"
                )
              }
            >
              <strong>
                Intermediate
              </strong>

              <small>
                Practical interview-level
                questions
              </small>

              <span>
                {difficulty ===
                  "intermediate"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={
                difficulty ===
                "advanced"
                  ? "difficulty-option active"
                  : "difficulty-option"
              }
              onClick={() =>
                setDifficulty(
                  "advanced"
                )
              }
            >
              <strong>
                Advanced
              </strong>

              <small>
                Deep technical & challenging
                questions
              </small>

              <span>
                {difficulty ===
                  "advanced"
                  ? "✓"
                  : ""}
              </span>
            </button>
          </div>
        </section>

        {/* Question Count */}
        <section className="setup-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                STEP 04
              </span>

              <h2>
                Number of questions
              </h2>

              <p>
                Choose how long you want the
                interview to be.
              </p>
            </div>
          </div>

          <div className="question-count-control">
            <button
              type="button"
              onClick={() =>
                setQuestionCount(
                  Math.max(
                    1,
                    Number(
                      questionCount
                    ) - 1
                  )
                )
              }
              disabled={
                Number(
                  questionCount
                ) <= 1
              }
            >
              −
            </button>

            <div>
              <strong>
                {questionCount}
              </strong>

              <span>
                questions
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setQuestionCount(
                  Math.min(
                    100,
                    Number(
                      questionCount
                    ) + 1
                  )
                )
              }
              disabled={
                Number(
                  questionCount
                ) >= 100
              }
            >
              +
            </button>
          </div>

          <div className="question-count-input">
            <label htmlFor="questionCount">
              Or enter a number
            </label>

            <input
              id="questionCount"
              type="number"
              min="1"
              max="100"
              value={questionCount}
              onChange={
                handleQuestionCountChange
              }
            />
          </div>
        </section>

        {/* Summary */}
        <section className="setup-summary">
          <div className="eyebrow">
            INTERVIEW SUMMARY
          </div>

          <div className="setup-summary-row">
            <span>
              Type
            </span>

            <strong>
              {formatLabel(
                interviewType
              )}
            </strong>
          </div>

          <div className="setup-summary-row">
            <span>
              Role
            </span>

            <strong>
              {role
                ? formatLabel(role)
                : "Not selected"}
            </strong>
          </div>

          <div className="setup-summary-row">
            <span>
              Difficulty
            </span>

            <strong>
              {formatLabel(
                difficulty
              )}
            </strong>
          </div>

          <div className="setup-summary-row">
            <span>
              Questions
            </span>

            <strong>
              {questionCount}
            </strong>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="form-error">
            <span>!</span>

            <p>
              {error}
            </p>
          </div>
        )}

        {/* Start */}
        <section className="setup-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={
              loading ||
              !role.trim()
            }
          >
            {loading
              ? "Creating Interview..."
              : "Start Interview"}

            <span>→</span>
          </button>

          <p>
            You'll check your camera and
            microphone before the interview
            begins.
          </p>
        </section>
      </form>

      {/* Question Bank */}
      <button
        type="button"
        className="setup-admin-link"
        onClick={() =>
          navigate(
            "/admin/questions"
          )
        }
      >
        <span>
          Question Bank
        </span>

        <span>
          →
        </span>
      </button>

      {/* Bottom Navigation */}
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
            navigate(
              "/interview/history"
            )
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