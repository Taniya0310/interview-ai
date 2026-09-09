import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../services/authApi";
const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function api(path, options = {}) {
  return authenticatedFetch(path, options);
}
function getQuestionTypeLabel(answer) {
  const isFollowUp =
    answer?.questionType === "follow_up" ||
    answer?.question_type === "follow_up" ||
    answer?.is_follow_up === true ||
    answer?.isFollowUp === true;

  return isFollowUp
    ? "Follow-up question"
    : "Main question";
}
function getRadarPoints(scores, radius = 72, center = 90) {
  const values = Object.values(scores || {}).slice(0, 6).map((value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
  });
  const count = Math.max(values.length, 3);
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    const distance = (value / 100) * radius;
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  }).join(" ");
}

function RadarChart({ scores }) {
  const values = Object.values(scores || {}).slice(0, 6);
  const count = Math.max(values.length, 3);
  const outline = Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    return `${90 + Math.cos(angle) * 72},${90 + Math.sin(angle) * 72}`;
  }).join(" ");

  return <svg className="results-radar-chart" viewBox="0 0 180 180" role="img" aria-label="Performance radar chart">
    <polygon points={outline} className="radar-grid" />
    <polygon points={getRadarPoints(scores, 72, 90)} className="radar-value" />
    {Array.from({ length: count }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      const label = String(values[index] === undefined ? "" : Object.keys(scores || {})[index] || "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
      const labelX = 90 + Math.cos(angle) * 86;
      const labelY = 90 + Math.sin(angle) * 86;
      return [
        <line key={`axis-${index}`} x1="90" y1="90" x2={90 + Math.cos(angle) * 72} y2={90 + Math.sin(angle) * 72} className="radar-axis" />,
        <text key={`label-${index}`} x={labelX} y={labelY} className="radar-label" textAnchor={labelX < 82 ? "end" : labelX > 98 ? "start" : "middle"}>{label}</text>,
      ];
    })}
  </svg>;
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

function getScores(report) {
  if (
    report?.scores &&
    typeof report.scores === "object" &&
    !Array.isArray(report.scores)
  ) {
    return report.scores;
  }

  return {};
}

function getOverallScore(report) {
  /*
   * Preferred:
   * report.score / overall_score
   *
   * Fallback:
   * Average numeric values from report.scores.
   */
  const directScore =
    report?.score ??
    report?.overall_score ??
    report?.overallScore;

  if (
    directScore !== null &&
    directScore !== undefined &&
    directScore !== ""
  ) {
    const score = Number(directScore);

    if (Number.isFinite(score)) {
      return Math.round(score);
    }
  }

  const scores = Object.values(
    getScores(report)
  )
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!scores.length) {
    return null;
  }

  return Math.round(
    scores.reduce(
      (sum, value) => sum + value,
      0
    ) / scores.length
  );
}

function getStrengths(report) {
  const value =
    report?.strengths ??
    report?.overall_strengths ??
    report?.overallStrengths ??
    [];

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return [value];
  }

  return [];
}

function getWeakAreas(report) {
  const value =
    report?.weakAreas ??
    report?.weak_areas ??
    report?.areas_to_improve ??
    report?.areasToImprove ??
    [];

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return [value];
  }

  return [];
}

function getSummary(report) {
  return (
    report?.summary ??
    report?.overall_summary ??
    report?.overallSummary ??
    report?.feedback ??
    ""
  );
}

function getRecommendations(report) {
  return Array.isArray(report?.recommendations) ? report.recommendations : [];
}

function getSpeechMetrics(report) {
  return report?.speechMetrics && typeof report.speechMetrics === "object" ? report.speechMetrics : {};
}

function getAnswerScore(answer) {
  const value =
    answer?.score ??
    answer?.result?.score ??
    answer?.result?.overallScore ??
    answer?.result?.overall_score ??
    null;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const score = Number(value);

  return Number.isFinite(score)
    ? Math.round(score)
    : null;
}

function getQuestionText(answer) {
  const isFollowUp =
    answer?.questionType === "follow_up" ||
    answer?.question_type === "follow_up" ||
    answer?.is_follow_up === true ||
    answer?.isFollowUp === true;

  if (isFollowUp) {
    return (
      answer?.question_text ??
      answer?.questionText ??
      answer?.follow_up_question ??
      answer?.followUpQuestion ??
      answer?.question ??
      "Follow-up question"
    );
  }

  return (
    answer?.question ??
    answer?.question_text ??
    answer?.questionText ??
    answer?.interview_question?.text ??
    answer?.interviewQuestion?.text ??
    "Interview question"
  );
}

function getAnswerId(answer, index) {
  return (
    answer?.answer_id ??
    answer?.id ??
    answer?.answerId ??
    index
  );
}

function getScoreLabel(score) {
  if (score === null) {
    return "Not scored";
  }

  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Good performance";
  }

  if (score >= 50) {
    return "Needs improvement";
  }

  return "Keep practicing";
}

function getScoreClass(score) {
  if (score === null) {
    return "";
  }

  if (score >= 85) {
    return "score-excellent";
  }

  if (score >= 70) {
    return "score-good";
  }

  if (score >= 50) {
    return "score-average";
  }

  return "score-low";
}

function renderListItem(item) {
  if (typeof item === "string") {
    return item;
  }

  return (
    item?.text ??
    item?.description ??
    item?.title ??
    "No additional details available."
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [report, setReport] = useState(
    location.state?.report || null
  );

  const [loading, setLoading] = useState(
    !location.state?.report
  );

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      const interviewId =
        location.state?.interviewId ||
        sessionStorage.getItem(
          "currentInterviewId"
        );

      if (!interviewId) {
        if (mounted) {
          setLoading(false);
          setError(
            "Interview ID is missing."
          );
        }

        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await api(
          `/analysis/interviews/${interviewId}/report`
        );

        if (!mounted) {
          return;
        }

        setReport(data);

        sessionStorage.setItem(
          "currentReport",
          JSON.stringify(data)
        );

        sessionStorage.setItem(
          "currentInterviewId",
          String(interviewId)
        );
      } catch (err) {
        console.error(
          "Results loading error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load interview results."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (!report) {
      loadReport();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [
    location.state,
    report,
  ]);

  const answers = useMemo(
    () => getAnswers(report),
    [report]
  );

  const scores = useMemo(
    () => getScores(report),
    [report]
  );

  const overallScore = useMemo(
    () => getOverallScore(report),
    [report]
  );

  const strengths = useMemo(
    () => getStrengths(report),
    [report]
  );

  const weakAreas = useMemo(
    () => getWeakAreas(report),
    [report]
  );

  const summary = useMemo(
    () => getSummary(report),
    [report]
  );

  const recommendations = useMemo(() => getRecommendations(report), [report]);
  const speechMetrics = useMemo(() => getSpeechMetrics(report), [report]);

  function handleDashboard() {
    navigate("/dashboard");
  }

  function handleHistory() {
    navigate("/interview/history");
  }

  function handlePracticeAgain() {
    navigate("/interview/setup");
  }

  function handleAnswer(answer, index) {
    const answerId =
      getAnswerId(answer, index);

    navigate(
      `/interview/answer/${answerId}`,
      {
        state: {
          answer,
          report,
        },
      }
    );
  }

  if (loading) {
    return (
      <main className="mobile-page loading-page">
        <div className="loading-spinner" />

        <h2>
          Preparing your results...
        </h2>

        <p>
          We're reviewing your interview
          performance.
        </p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="mobile-page results-page">
        <button
          type="button"
          className="back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

        <div className="results-error">
          <div className="empty-icon">
            !
          </div>

          <div className="eyebrow">
            RESULTS
          </div>

          <h1>
            Results unavailable
          </h1>

          <p>
            {error ||
              "We couldn't find your interview results."}
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={handleHistory}
          >
            View Interview History
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mobile-page results-page">
      {/* Header */}
      <header className="results-header">
        <button
          type="button"
          className="back-btn"
          onClick={handleDashboard}
        >
          ← Dashboard
        </button>

        <div className="eyebrow">
          INTERVIEW COMPLETE
        </div>

        <h1>
          Your interview results
        </h1>

        <p>
          Here's how you performed in this
          interview.
        </p>
      </header>

      {/* Overall Score */}
      <section className="results-score-card">
        <div className="results-score-ring">
          <div>
            <strong>
              {overallScore !== null
                ? overallScore
                : "—"}
            </strong>

            {overallScore !==
              null && (
              <span>/100</span>
            )}
          </div>
        </div>

        <div className="results-score-content">
          <span className="eyebrow">
            OVERALL PERFORMANCE
          </span>

          <h2>
            {getScoreLabel(
              overallScore
            )}
          </h2>

          <p>
            {answers.length > 0
              ? `${answers.length} answer${
                  answers.length === 1
                    ? ""
                    : "s"
                } reviewed`
              : "Interview reviewed"}
          </p>
        </div>
      </section>

      {/* Score Breakdown */}
      {Object.keys(scores).length >
        0 && (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                BREAKDOWN
              </span>

              <h2>
                Performance scores
              </h2>
            </div>
          </div>

          <div className="score-breakdown">
            {Object.entries(scores).map(
              ([name, value]) => {
                const score =
                  Number(value);

                const validScore =
                  Number.isFinite(
                    score
                  )
                    ? Math.round(
                        score
                      )
                    : null;

                return (
                  <div
                    className="score-breakdown-item"
                    key={name}
                  >
                    <div className="score-breakdown-header">
                      <span>
                        {String(name)
                          .replace(
                            /[-_]/g,
                            " "
                          )
                          .replace(
                            /\b\w/g,
                            (letter) =>
                              letter.toUpperCase()
                          )}
                      </span>

                      <strong>
                        {validScore !==
                        null
                          ? validScore
                          : "—"}
                      </strong>
                    </div>

                    {validScore !==
                      null && (
                      <div className="score-progress">
                        <span
                          style={{
                            width: `${Math.min(
                              Math.max(
                                validScore,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* Summary */}
      {summary && (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                SUMMARY
              </span>

              <h2>
                Overall feedback
              </h2>
            </div>
          </div>

          <div className="results-summary-card">
            <div className="results-summary-icon">
              ✦
            </div>

            <p>
              {summary}
            </p>
          </div>
        </section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                WHAT WENT WELL
              </span>

              <h2>
                Your strengths
              </h2>
            </div>
          </div>

          <div className="results-list">
            {strengths.map(
              (item, index) => (
                <div
                  className="results-list-item positive"
                  key={index}
                >
                  <span>
                    ✓
                  </span>

                  <p>
                    {renderListItem(
                      item
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <section className="results-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                NEXT STEPS
              </span>

              <h2>
                Areas to improve
              </h2>
            </div>
          </div>

          <div className="results-list">
            {weakAreas.map(
              (item, index) => (
                <div
                  className="results-list-item improvement"
                  key={index}
                >
                  <span>
                    !
                  </span>

                  <p>
                    {renderListItem(
                      item
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {Object.keys(speechMetrics).length > 0 && (
        <section className="results-section results-metrics-section">
          <div className="section-heading"><div><span className="eyebrow">SPEECH METRICS</span><h2>Speaking performance</h2></div></div>
          <div className="results-metrics-grid">{Object.entries(speechMetrics).map(([name, value]) => <div className="results-metric-card" key={name}><span>{name.replace(/([A-Z])/g, " $1")}</span><strong>{value}</strong></div>)}</div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="results-section results-recommendations-section">
          <div className="section-heading"><div><span className="eyebrow">RECOMMENDATIONS</span><h2>How to improve</h2></div></div>
          <div className="results-recommendations">{recommendations.map((item, index) => <div key={index}><span>{index + 1}</span><p>{renderListItem(item)}</p></div>)}</div>
        </section>
      )}

      {/* Answer Breakdown */}
      <section className="results-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              ANSWERS
            </span>

            <h2>
              Question by question
            </h2>
          </div>

          <span className="results-count">
            {answers.length}
          </span>
        </div>
{answers.length > 0 ? (
  <div className="answer-results-list">
    {answers.map((answer, index) => {
      const questionType =
        getQuestionTypeLabel(answer);

      const score = getAnswerScore(answer);

      return (
        <button
          type="button"
          className="answer-result-card"
          key={`${getAnswerId(answer, index)}-${index}`}
          onClick={() => handleAnswer(answer, index)}
        >
          <div className="answer-number">
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="answer-result-content">
            <span className="answer-type-label">
              {questionType}
            </span>

            <h3>
              {getQuestionText(answer)}
            </h3>

            {answer?.result?.metricsPending && (
              <span className="metrics-pending">
                Detailed metrics are still processing
              </span>
            )}
          </div>

          <div className="answer-result-score">
            {score !== null ? (
              <>
                <strong className={getScoreClass(score)}>
                  {score}
                </strong>
                <small>/100</small>
              </>
            ) : (
              <span>View</span>
            )}

            <b>→</b>
          </div>
        </button>
      );
    })}
  </div>
) : (
  <div className="results-empty">
    <p>
      Individual answer results are not available yet.
    </p>
  </div>
)}
      </section>

      {/* Actions */}
      <section className="results-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={
            handlePracticeAgain
          }
        >
          Practice Again
          <span>→</span>
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={handleHistory}
        >
          View Interview History
        </button>

        <button
          type="button"
          className="text-btn results-dashboard-btn"
          onClick={
            handleDashboard
          }
        >
          Back to Dashboard
        </button>
      </section>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={
            handleDashboard
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={
            handleHistory
          }
        >
          <span>◷</span>
          <small>History</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={
            handlePracticeAgain
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
