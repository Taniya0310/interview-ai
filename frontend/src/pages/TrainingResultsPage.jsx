import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTrainingReport } from "../services/trainingApi";
import "../styles/training.css";

function getAnalysis(answer) {
  const value = answer?.analysis;

  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return value;
}

function getAnswerScore(answer) {
  const analysis = getAnalysis(answer);

  const value = [
    analysis?.score,
    analysis?.overallScore,
    answer?.score
  ].find(
    (score) =>
      score !== null &&
      score !== undefined &&
      score !== ""
  );

  const score = Number(value);

  return Number.isFinite(score)
    ? Math.min(Math.max(Math.round(score), 0), 100)
    : null;
}

function getFeedback(answer) {
  const analysis = getAnalysis(answer);

  return (
    analysis?.questionFeedback ||
    analysis?.feedback ||
    answer?.feedback ||
    "No feedback available."
  );
}

function getTranscript(answer) {
  const analysis = getAnalysis(answer);

  return (
    analysis?.transcript ||
    answer?.answer_text ||
    "Transcript unavailable."
  );
}

function getScoreLabel(score) {
  if (score === null) return "Not scored";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs improvement";
  return "Keep practicing";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
}

export default function TrainingResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const sessionId =
    location.state?.sessionId ||
    sessionStorage.getItem(
      "currentTrainingSessionId"
    );

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem(
        "currentTrainingSessionId",
        String(sessionId)
      );
    }
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      if (!sessionId) {
        setError("Training session was not found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result =
          await getTrainingReport(sessionId);

        if (mounted) {
          setReport(result);
          console.log(
            "Training report:",
            result
          );
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError?.message ||
              "Unable to load training results."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const session = report?.session;

  const answers = Array.isArray(report?.answers)
    ? report.answers
    : [];

  const scores = useMemo(
    () =>
      answers
        .map((answer) => getAnswerScore(answer))
        .filter((score) => score !== null),
    [answers]
  );

  const overallScore = scores.length
    ? Math.round(
        scores.reduce(
          (total, score) => total + score,
          0
        ) / scores.length
      )
    : null;

  const answeredCount = Number(
    session?.completed_questions ??
      answers.length
  );

  const totalQuestions = Number(
    session?.total_questions || 0
  );

  const progress = totalQuestions
    ? Math.min(
        Math.round(
          (answeredCount / totalQuestions) * 100
        ),
        100
      )
    : 0;

  const isCompleted =
    session?.status === "completed" &&
    answeredCount >= totalQuestions;

  if (loading) {
    return (
      <main className="training-page">
        <section className="training-card">
          <p className="eyebrow">
            TRAINING RESULTS
          </p>

          <h1>Loading your results...</h1>

          <p>
            Please wait while we prepare your
            analysis.
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="training-page">
        <section className="training-card">
          <p className="eyebrow">
            TRAINING RESULTS
          </p>

          <h1>Results unavailable</h1>

          <p className="training-error">
            {error}
          </p>

          <button
            type="button"
            className="training-start-button"
            onClick={() =>
              navigate("/training/setup")
            }
          >
            Start New Training
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="training-page">
      <section className="training-card training-results-page">
        <button
          type="button"
          className="training-back"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <header className="training-results-header">
          <p className="eyebrow">
            TRAINING RESULTS
          </p>

          <h1>Your training analysis</h1>

          <p>
            Review your performance and improve
            with every practice session.
          </p>
        </header>

        <section className="training-results-summary">
          <div className="training-score-circle">
            <strong>
              {overallScore ?? "—"}
            </strong>

            <span>/100</span>
          </div>

          <div className="training-summary-content">
            <span className="training-label">
              OVERALL PERFORMANCE
            </span>

            <h2>
              {getScoreLabel(overallScore)}
            </h2>

            <p>
              {session?.status === "abandoned"
                ? "You quit this training session before completing all questions."
                : isCompleted
                ? overallScore > 0
                  ? "You completed this training session successfully."
                  : "You completed the session, but your answers need improvement."
                : "This training session is incomplete."}
            </p>
          </div>
        </section>

        <section className="training-result-stats">
          <div>
            <span>Category</span>
            <strong>
              {session?.category_name ||
                "Training"}
            </strong>
          </div>

          <div>
            <span>Questions answered</span>
            <strong>
              {answeredCount}/
              {totalQuestions || "—"}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {session?.status === "abandoned"
                ? "Quit"
                : isCompleted
                ? "Completed"
                : "Incomplete"}
            </strong>
          </div>

          <div>
            <span>Date</span>
            <strong>
              {formatDate(
                session?.completed_at ||
                  session?.started_at
              )}
            </strong>
          </div>
        </section>

        <section className="training-progress-section">
          <div className="training-progress-heading">
            <strong>Training progress</strong>
            <span>{progress}%</span>
          </div>

          <div className="training-progress-bar">
            <span
              style={{
                width: `${progress}%`
              }}
            />
          </div>
        </section>

        <section className="training-answer-results">
          <div className="training-section-heading">
            <p className="eyebrow">
              QUESTION ANALYSIS
            </p>

            <h2>Your answers</h2>
          </div>

          {answers.length === 0 ? (
            <div className="training-empty-results">
              No answers were recorded for this
              training.
            </div>
          ) : (
            answers.map((answer, index) => {
              const score =
                getAnswerScore(answer);

              return (
                <article
                  className="training-answer-result"
                  key={answer.id || index}
                >
                  <div className="training-answer-result-top">
                    <span className="training-answer-number">
                      {index + 1}
                    </span>

                    <div>
                      <h3>
                        {answer.question_text ||
                          "Training question"}
                      </h3>

                      <span className="training-answer-score">
                        {score === null
                          ? "Not scored"
                          : `${score}/100`}
                      </span>
                    </div>
                  </div>

                  <div className="training-answer-block">
                    <strong>Your response</strong>
                    <p>
                      {getTranscript(answer)}
                    </p>
                  </div>

                  <div className="training-answer-block">
                    <strong>AI feedback</strong>
                    <p>
                      {getFeedback(answer)}
                    </p>
                  </div>

                  {score !== null && (
                    <div className="training-answer-progress">
                      <span
                        style={{
                          width: `${score}%`
                        }}
                      />
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        <div className="training-results-actions">
          <button
            type="button"
            className="training-start-button"
            onClick={() =>
              navigate("/training/setup")
            }
          >
            Practice Again
          </button>

          <button
            type="button"
            className="training-secondary-button"
            onClick={() =>
              navigate("/interview/history")
            }
          >
            View History
          </button>
        </div>
      </section>
    </main>
  );
}