import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLoader from "../components/PageLoader";
const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function api(path) {
  const response = await fetch(`${API}${path}`);

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function getAnswers(report) {
  if (Array.isArray(report?.answers)) {
    return report.answers;
  }

  if (Array.isArray(report?.results)) {
    return report.results;
  }

  return [];
}

function getInterviewId(location) {
  return (
    location.state?.interviewId ||
    sessionStorage.getItem("currentInterviewId") ||
    null
  );
}

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const interviewId = useMemo(
    () => getInterviewId(location),
    [location]
  );

  const [status, setStatus] = useState(
    "Preparing your results..."
  );

  const [progress, setProgress] =
    useState(10);

  const [completedAnswers, setCompletedAnswers] =
    useState(0);

  const [totalAnswers, setTotalAnswers] =
    useState(0);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!interviewId) {
      setError(
        "Interview ID is missing. Please start the interview again."
      );

      return;
    }

    sessionStorage.setItem(
      "currentInterviewId",
      String(interviewId)
    );

    let mounted = true;
    let timeoutId = null;

    async function checkReport() {
      try {
        const report = await api(
          `/analysis/interviews/${interviewId}/report`
        );

        if (!mounted) {
          return;
        }

        const answers =
          getAnswers(report);

        const total =
          Number(
            report?.total_questions ??
              report?.totalQuestions ??
              report?.question_count ??
              report?.questionCount ??
              answers.length
          ) || answers.length;

        /*
         * An answer is considered complete when
         * the backend has a result for it.
         */
        const completed =
          answers.filter(
            (answer) =>
              answer?.result &&
              !answer?.result?.metricsPending
          ).length;

        setTotalAnswers(total);
        setCompletedAnswers(
          completed
        );

        if (total > 0) {
          const calculated =
            Math.round(
              (completed / total) *
                100
            );

          setProgress(
            Math.min(
              95,
              Math.max(
                10,
                calculated
              )
            )
          );
        }

        /*
         * The interview report is ready when
         * every expected answer has a result.
         */
        const reportReady =
          total > 0 &&
          completed >= total;

        if (reportReady) {
          setProgress(100);
          setStatus(
            "Your results are ready."
          );

          sessionStorage.setItem(
            "currentReport",
            JSON.stringify(report)
          );

          setTimeout(() => {
            if (!mounted) {
              return;
            }

            navigate(
              "/interview/results",
              {
                state: {
                  interviewId,
                  report,
                },
                replace: true,
              }
            );
          }, 500);

          return;
        }

        if (completed > 0) {
          setStatus(
            "Analyzing your answers..."
          );
        } else {
          setStatus(
            "Reviewing your interview..."
          );
        }

        timeoutId = setTimeout(
          checkReport,
          1500
        );
      } catch (err) {
        console.error(
          "Processing error:",
          err
        );

        if (!mounted) {
          return;
        }

        /*
         * The report endpoint can briefly be unavailable
         * immediately after interview completion.
         * Retry instead of failing immediately.
         */
        setStatus(
          "Still processing your interview..."
        );

        timeoutId = setTimeout(
          checkReport,
          2000
        );
      }
    }

    checkReport();

    return () => {
      mounted = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [interviewId, navigate]);

  function handleDashboard() {
    navigate("/dashboard");
  }

  function handleHistory() {
    navigate("/interview/history");
  }

  return (
    <main className="mobile-page processing-page">
      {/* Header */}
      <header className="processing-header">
        <div className="eyebrow">
          INTERVIEW COMPLETE
        </div>

        <h1>
          Analyzing your interview
        </h1>

        <p>
          Please wait while AI reviews your
          responses and prepares your
          personalized feedback.
        </p>
      </header>

      {/* Processing Animation */}
      {/* Processing Animation */}
<section className="processing-visual">
  <PageLoader />
</section>

      {/* Status */}
      <section className="processing-status">
        <div className="processing-status-row">
          <span>
            {status}
          </span>

          <strong>
            {progress}%
          </strong>
        </div>

        <div className="processing-progress">
          <span
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {totalAnswers > 0 && (
          <p>
            {completedAnswers} of{" "}
            {totalAnswers} answers analyzed
          </p>
        )}
      </section>

      {/* Processing Steps */}
      <section className="processing-steps">
        <div
          className={
            `processing-step ` +
            (progress >= 20
              ? "completed"
              : "active")
          }
        >
          <div className="processing-step-icon">
            {progress >= 20
              ? "✓"
              : "1"}
          </div>

          <div>
            <h3>
              Collecting responses
            </h3>

            <p>
              Making sure all interview answers
              are ready.
            </p>
          </div>
        </div>

        <div
          className={
            `processing-step ` +
            (progress >= 60
              ? "completed"
              : progress >= 20
                ? "active"
                : "")
          }
        >
          <div className="processing-step-icon">
            {progress >= 60
              ? "✓"
              : "2"}
          </div>

          <div>
            <h3>
              Analyzing answers
            </h3>

            <p>
              Evaluating your responses and
              interview performance.
            </p>
          </div>
        </div>

        <div
          className={
            `processing-step ` +
            (progress >= 100
              ? "completed"
              : progress >= 60
                ? "active"
                : "")
          }
        >
          <div className="processing-step-icon">
            {progress >= 100
              ? "✓"
              : "3"}
          </div>

          <div>
            <h3>
              Preparing feedback
            </h3>

            <p>
              Building your personalized
              performance report.
            </p>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <section className="processing-error">
          <div className="processing-error-icon">
            !
          </div>

          <div>
            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            className="secondary-btn"
            onClick={() =>
              navigate(
                "/interview/setup"
              )
            }
          >
            Start Again
          </button>
        </section>
      )}

      {/* Info */}
      {!error && (
        <div className="processing-note">
          <span>●</span>

          <p>
            You can keep this screen open.
            Your results will appear
            automatically when they're ready.
          </p>
        </div>
      )}

      {/* Bottom Actions */}
      <section className="processing-actions">
        <button
          type="button"
          className="text-btn"
          onClick={handleHistory}
        >
          View Interview History
        </button>

        <button
          type="button"
          className="text-btn"
          onClick={handleDashboard}
        >
          Back to Dashboard
        </button>
      </section>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={handleDashboard}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={handleHistory}
        >
          <span>◷</span>
          <small>History</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate(
              "/interview/setup"
            )
          }
        >
          <span className="nav-plus">
            +
          </span>

          <small>Practice</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/settings")
          }
        >
          <span>⚙</span>
          <small>Settings</small>
        </button>
      </nav>
    </main>
  );
}