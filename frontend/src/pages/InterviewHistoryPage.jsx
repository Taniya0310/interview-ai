import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

function getInterviewId(interview) {
  return (
    interview?.id ??
    interview?.interview_id ??
    interview?.interviewId ??
    null
  );
}

function getScore(interview) {
  const value =
    interview?.score ??
    interview?.overall_score ??
    interview?.overallScore ??
    interview?.report?.score ??
    null;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.round(number)
    : null;
}

function getRole(interview) {
  return (
    interview?.role ??
    interview?.job_role ??
    interview?.jobRole ??
    "Interview"
  );
}

function getInterviewType(interview) {
  return (
    interview?.interviewType ??
    interview?.interview_type ??
    interview?.type ??
    "Technical"
  );
}

function getDifficulty(interview) {
  return (
    interview?.difficulty ??
    "Beginner"
  );
}

function getStatus(interview) {
  return (
    interview?.status ??
    interview?.state ??
    "completed"
  );
}

function getDate(interview) {
  const value =
    interview?.created_at ??
    interview?.createdAt ??
    interview?.started_at ??
    interview?.startedAt ??
    interview?.date;

  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getTime(interview) {
  const value =
    interview?.created_at ??
    interview?.createdAt ??
    interview?.started_at ??
    interview?.startedAt;

  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function formatLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getScoreClass(score) {
  if (score === null) {
    return "";
  }

  if (score >= 80) {
    return "score-excellent";
  }

  if (score >= 60) {
    return "score-good";
  }

  if (score >= 40) {
    return "score-average";
  }

  return "score-low";
}

function getStatusLabel(status) {
  const normalized =
    String(status || "")
      .toLowerCase();

  if (
    normalized === "completed" ||
    normalized === "finished"
  ) {
    return "Completed";
  }

  if (
    normalized === "processing" ||
    normalized === "analyzing"
  ) {
    return "Processing";
  }

  if (
    normalized === "in_progress" ||
    normalized === "in-progress"
  ) {
    return "In progress";
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "Cancelled";
  }

  return formatLabel(status);
}

export default function InterviewHistoryPage() {
  const navigate = useNavigate();

  const [interviews, setInterviews] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        /*
         * Uses the existing interviews API.
         *
         * If your backend later exposes a dedicated
         * /interviews/history endpoint, this can be
         * changed without affecting the UI.
         */
        const data =
          await api("/interviews");

        if (!mounted) {
          return;
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(
                data?.interviews
              )
            ? data.interviews
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setInterviews(list);
      } catch (err) {
        console.error(
          "Interview history error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load interview history."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  function handleBack() {
    navigate("/dashboard");
  }

  function handleOpenInterview(
    interview
  ) {
    const id =
      getInterviewId(interview);

    if (!id) {
      return;
    }

    sessionStorage.setItem(
      "currentInterviewId",
      String(id)
    );

    navigate(
      "/interview/results",
      {
        state: {
          interviewId: id,
        },
      }
    );
  }

  function handleStartNew() {
    navigate("/interview/setup");
  }

  const filteredInterviews =
    interviews.filter(
      (interview) => {
        const role =
          getRole(interview);

        const type =
          getInterviewType(
            interview
          );

        const query =
          search
            .trim()
            .toLowerCase();

        const matchesSearch =
          !query ||
          String(role)
            .toLowerCase()
            .includes(query) ||
          String(type)
            .toLowerCase()
            .includes(query);

        const status =
          String(
            getStatus(interview)
          ).toLowerCase();

        let matchesFilter = true;

        if (
          filter === "completed"
        ) {
          matchesFilter =
            status ===
              "completed" ||
            status === "finished";
        }

        if (
          filter === "processing"
        ) {
          matchesFilter =
            status ===
              "processing" ||
            status === "analyzing";
        }

        if (
          filter === "in-progress"
        ) {
          matchesFilter =
            status ===
              "in_progress" ||
            status ===
              "in-progress";
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );

  const completedCount =
    interviews.filter(
      (item) => {
        const status =
          String(
            getStatus(item)
          ).toLowerCase();

        return (
          status === "completed" ||
          status === "finished"
        );
      }
    ).length;

  const scoredInterviews =
    interviews
      .map((item) =>
        getScore(item)
      )
      .filter(
        (score) =>
          score !== null
      );

  const averageScore =
    scoredInterviews.length
      ? Math.round(
          scoredInterviews.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
            scoredInterviews.length
        )
      : null;

  return (
    <main className="mobile-page history-page">
      {/* Header */}
      <header className="history-header">
        <button
          type="button"
          className="back-btn"
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">
            YOUR PROGRESS
          </div>

          <h1>
            Interview history
          </h1>

          <p>
            Review your previous interviews
            and track your improvement.
          </p>
        </div>
      </header>

      {/* Stats */}
      {!loading &&
        !error &&
        interviews.length > 0 && (
          <section className="history-stats">
            <div className="history-stat">
              <span>
                Interviews
              </span>

              <strong>
                {completedCount}
              </strong>

              <small>
                completed
              </small>
            </div>

            <div className="history-stat">
              <span>
                Average score
              </span>

              <strong>
                {averageScore ??
                  "—"}
              </strong>

              <small>
                out of 100
              </small>
            </div>
          </section>
        )}

      {/* Search */}
      {!loading &&
        !error &&
        interviews.length > 0 && (
          <section className="history-controls">
            <div className="history-search">
              <span>
                ⌕
              </span>

              <input
                type="search"
                placeholder="Search interviews..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="history-filters">
              <button
                type="button"
                className={
                  filter === "all"
                    ? "history-filter active"
                    : "history-filter"
                }
                onClick={() =>
                  setFilter("all")
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  filter ===
                  "completed"
                    ? "history-filter active"
                    : "history-filter"
                }
                onClick={() =>
                  setFilter(
                    "completed"
                  )
                }
              >
                Completed
              </button>

              <button
                type="button"
                className={
                  filter ===
                  "processing"
                    ? "history-filter active"
                    : "history-filter"
                }
                onClick={() =>
                  setFilter(
                    "processing"
                  )
                }
              >
                Processing
              </button>
            </div>
          </section>
        )}

      {/* Loading */}
      {loading && (
        <section className="history-loading">
          <div className="loading-spinner" />

          <h3>
            Loading your history...
          </h3>

          <p>
            Please wait a moment.
          </p>
        </section>
      )}

      {/* Error */}
      {!loading && error && (
        <section className="history-error">
          <div className="empty-icon">
            !
          </div>

          <h2>
            Couldn't load history
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </section>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        interviews.length === 0 && (
          <section className="history-empty">
            <div className="empty-history-icon">
              ◷
            </div>

            <div className="eyebrow">
              NO INTERVIEWS YET
            </div>

            <h2>
              Your journey starts here
            </h2>

            <p>
              Complete your first AI interview
              and your results will appear in
              this section.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={
                handleStartNew
              }
            >
              Start Your First Interview
              <span>→</span>
            </button>
          </section>
        )}

      {/* No search results */}
      {!loading &&
        !error &&
        interviews.length > 0 &&
        filteredInterviews.length ===
          0 && (
          <section className="history-empty compact">
            <div className="empty-history-icon">
              ⌕
            </div>

            <h2>
              No matching interviews
            </h2>

            <p>
              Try changing your search or
              filter.
            </p>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear Filters
            </button>
          </section>
        )}

      {/* Interview List */}
      {!loading &&
        !error &&
        filteredInterviews.length >
          0 && (
          <section className="history-list-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  INTERVIEWS
                </span>

                <h2>
                  Your attempts
                </h2>
              </div>

              <span className="history-count">
                {filteredInterviews.length}
              </span>
            </div>

            <div className="history-list">
              {filteredInterviews.map(
                (
                  interview,
                  index
                ) => {
                  const id =
                    getInterviewId(
                      interview
                    );

                  const score =
                    getScore(
                      interview
                    );

                  const status =
                    getStatus(
                      interview
                    );

                  const scoreClass =
                    getScoreClass(
                      score
                    );

                  return (
                    <button
                      type="button"
                      className="history-card"
                      key={
                        id ||
                        index
                      }
                      onClick={() =>
                        handleOpenInterview(
                          interview
                        )
                      }
                    >
                      <div className="history-card-top">
                        <div className="history-card-icon">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div className="history-card-title">
                          <h3>
                            {formatLabel(
                              getRole(
                                interview
                              )
                            )}
                          </h3>

                          <p>
                            {getDate(
                              interview
                            )}

                            {getTime(
                              interview
                            ) && (
                              <>
                                {" "}
                                ·{" "}
                                {getTime(
                                  interview
                                )}
                              </>
                            )}
                          </p>
                        </div>

                        <span className="history-card-arrow">
                          →
                        </span>
                      </div>

                      <div className="history-card-divider" />

                      <div className="history-card-meta">
                        <span className="history-tag">
                          {formatLabel(
                            getInterviewType(
                              interview
                            )
                          )}
                        </span>

                        <span className="history-tag">
                          {formatLabel(
                            getDifficulty(
                              interview
                            )
                          )}
                        </span>

                        <span
                          className={
                            `history-status ` +
                            (status ===
                              "completed" ||
                            status ===
                              "finished"
                              ? "completed"
                              : "")
                          }
                        >
                          {getStatusLabel(
                            status
                          )}
                        </span>
                      </div>

                      {score !==
                        null && (
                        <div className="history-score-row">
                          <div>
                            <span>
                              Overall score
                            </span>

                            <strong
                              className={
                                scoreClass
                              }
                            >
                              {score}
                              <small>
                                /100
                              </small>
                            </strong>
                          </div>

                          <div className="history-score-bar">
                            <span
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    score,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

      {/* Start another */}
      {!loading &&
        !error &&
        interviews.length > 0 && (
          <section className="history-bottom-cta">
            <p>
              Ready for another round?
            </p>

            <button
              type="button"
              className="secondary-btn"
              onClick={
                handleStartNew
              }
            >
              Start New Interview
              <span>→</span>
            </button>
          </section>
        )}

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item active"
          onClick={() =>
            navigate(
              "/interview/history"
            )
          }
        >
          <span>◷</span>
          <small>History</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={
            handleStartNew
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