import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness } from "lucide-react";
import PageLoader from "../components/PageLoader";
import { authenticatedFetch } from "../services/authApi";

async function api(path, options = {}) {
  return authenticatedFetch(path, options);
}

function isTraining(item) {
  return item?.type === "training";
}

function getId(item) {
  return (
    item?.id ||
    item?.interview_id ||
    item?.interviewId ||
    null
  );
}

function getRole(item) {
  if (isTraining(item)) {
    return item.title || "Voice Training";
  }

  return `Interview ${item?.interview_number || ""}`;
}

function getType(item) {
  if (isTraining(item)) {
    return item.category_name || "Training";
  }

  return (
    item?.interviewType ||
    item?.interview_type ||
    "Technical"
  );
}

function getDifficulty(item) {
  return item?.difficulty || "Beginner";
}

function getStatus(item) {
  return item?.status || "completed";
}

function getScore(item) {
  const value =
    item?.score ??
    item?.overall_score ??
    item?.overallScore ??
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

function getDate(item) {
  const value =
    item?.created_at ||
    item?.started_at ||
    item?.createdAt ||
    item?.date;

  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getTime(item) {
  const value =
    item?.created_at ||
    item?.started_at ||
    item?.createdAt;

  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  });
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
  const value = String(
    status || ""
  ).toLowerCase();

  if (
    value === "completed" ||
    value === "finished"
  ) {
    return "Completed";
  }

  if (
    value === "abandoned" ||
    value === "stopped"
  ) {
    return "Stopped";
  }

  if (
    value === "in_progress" ||
    value === "in-progress"
  ) {
    return "In progress";
  }

  if (
    value === "processing" ||
    value === "analyzing"
  ) {
    return "Processing";
  }

  if (
    value === "quit" ||
    value === "quited"
  ) {
    return "Quit";
  }

  if (
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "Cancelled";
  }

  return formatLabel(status);
}

export default function InterviewHistoryPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const data = await api("/interviews");

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.interviews)
            ? data.interviews
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (mounted) {
          setItems(list);
        }
      } catch (requestError) {
        if (mounted) {
          setError(
            requestError?.message ||
            "Unable to load history."
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

  function handleOpenItem(item) {
    const id = getId(item);

    if (!id) {
      return;
    }

    if (isTraining(item)) {
      sessionStorage.setItem(
        "currentTrainingSessionId",
        String(id)
      );

      navigate("/training/results", {
        state: {
          sessionId: id
        }
      });

      return;
    }

    sessionStorage.setItem(
      "currentInterviewId",
      String(id)
    );

    navigate("/interview/results", {
      state: {
        interviewId: id
      }
    });
  }

  function handleStartNew() {
    navigate("/interview/setup");
  }

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase();

    const searchableText = [
      getRole(item),
      getType(item),
      getDifficulty(item)
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !query ||
      searchableText.includes(query);

    const status = String(
      getStatus(item)
    ).toLowerCase();

    let matchesFilter = true;

    if (filter === "completed") {
      matchesFilter =
        status === "completed" ||
        status === "finished";
    }

    if (filter === "processing") {
      matchesFilter =
        status === "processing" ||
        status === "analyzing";
    }

    if (filter === "in-progress") {
      matchesFilter =
        status === "in_progress" ||
        status === "in-progress";
    }

    return matchesSearch && matchesFilter;
  });

  const completedCount = items.filter((item) => {
    const status = String(
      getStatus(item)
    ).toLowerCase();

    return (
      status === "completed" ||
      status === "finished"
    );
  }).length;

  const scores = items
    .map((item) => getScore(item))
    .filter((score) => score !== null);

  const averageScore = scores.length
    ? Math.round(
        scores.reduce(
          (total, score) => total + score,
          0
        ) / scores.length
      )
    : null;

  return (
    <main className="mobile-page history-page">
      <header className="history-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">
            YOUR PROGRESS
          </div>

          <h1>History</h1>

          <p>
            Review your previous interviews and
            training sessions.
          </p>
        </div>
      </header>

      {!loading &&
        !error &&
        items.length > 0 && (
          <section className="history-stats">
            <div className="history-stat">
              <span>Completed sessions</span>
              <strong>{completedCount}</strong>
              <small>sessions</small>
            </div>

            <div className="history-stat">
              <span>Average score</span>
              <strong>
                {averageScore ?? "—"}
              </strong>
              <small>out of 100</small>
            </div>
          </section>
        )}

      {!loading &&
        !error &&
        items.length > 0 && (
          <section className="history-controls">
            <div className="history-search">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search history..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="history-filters">
              {[
                ["all", "All"],
                ["completed", "Completed"],
                ["processing", "Processing"],
                
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? "history-filter active"
                      : "history-filter"
                  }
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

      {loading && <PageLoader />}

      {!loading && error && (
        <section className="history-error">
          <div className="empty-icon">!</div>

          <h2>Could not load history</h2>

          <p>{error}</p>

          <button
            type="button"
            className="primary-btn"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </section>
      )}

      {!loading &&
        !error &&
        items.length === 0 && (
          <section className="history-empty">
            <div className="empty-history-icon">
              ◷
            </div>

            <div className="eyebrow">
              NO HISTORY YET
            </div>

            <h2>Your journey starts here</h2>

            <p>
              Complete an interview or training
              session and your results will appear here.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={handleStartNew}
            >
              Start Practicing
              <span>→</span>
            </button>
          </section>
        )}

      {!loading &&
        !error &&
        items.length > 0 &&
        filteredItems.length === 0 && (
          <section className="history-empty compact">
            <div className="empty-history-icon">
              ⌕
            </div>

            <h2>No matching sessions</h2>

            <p>
              Try changing your search or filter.
            </p>
          </section>
        )}

      {!loading &&
        !error &&
        filteredItems.length > 0 && (
          <section className="history-list-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  INTERVIEWS AND TRAINING
                </span>

                <h2>Your attempts</h2>
              </div>

              <span className="history-count">
                {filteredItems.length}
              </span>
            </div>

            <div className="history-list">
              {filteredItems.map((item, index) => {
                const id = getId(item);
                const score = getScore(item);
                const status = getStatus(item);
                const training = isTraining(item);

                return (
                  <button
                    type="button"
                    className="history-card"
                    key={id || index}
                    onClick={() =>
                      handleOpenItem(item)
                    }
                  >
                    <div className="history-card-top">
                      <div className="history-card-icon">
                        <BriefcaseBusiness
                          size={22}
                          strokeWidth={2}
                        />
                      </div>

                      <div className="history-card-title">
                        <h3>
                          {formatLabel(
                            getRole(item)
                          )}
                        </h3>

                        <small className="history-item-kind">
                          {training
                            ? "Training"
                            : "Interview"}
                        </small>

                        <p>
                          {getDate(item)}

                          {getTime(item) && (
                            <>
                              {" · "}
                              {getTime(item)}
                            </>
                          )}

                          {training &&
                            item.total_questions && (
                              <>
                                {" · "}
                                {item.completed_questions || 0}
                                /{item.total_questions} answered
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
                        {formatLabel(getType(item))}
                      </span>

                      <span className="history-tag">
                        {formatLabel(
                          getDifficulty(item)
                        )}
                      </span>

                      <span
                        className={
                          `history-status ` +
                          (status === "completed" ||
                          status === "finished"
                            ? "completed"
                            : "")
                        }
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>

                    {score !== null && (
                      <div className="history-score-row">
                        <div>
                          <span>Overall score</span>

                          <strong
                            className={getScoreClass(
                              score
                            )}
                          >
                            {score}
                            <small>/100</small>
                          </strong>
                        </div>

                        <div className="history-score-bar">
                          <span
                            style={{
                              width: `${Math.min(
                                Math.max(score, 0),
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

      {!loading &&
        !error &&
        items.length > 0 && (
          <section className="history-bottom-cta">
            <p>Ready for another round?</p>

            <button
              type="button"
              className="secondary-btn"
              onClick={handleStartNew}
            >
              Start New Interview
              <span>→</span>
            </button>
          </section>
        )}

      <nav className="bottom-nav">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => navigate("/dashboard")}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item active"
          onClick={() =>
            navigate("/interview/history")
          }
        >
          <span>◷</span>
          <small>History</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={handleStartNew}
        >
          <span className="nav-plus">+</span>
          <small>Practice</small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => navigate("/settings")}
        >
          <span>⚙</span>
          <small>Settings</small>
        </button>
      </nav>
    </main>
  );
}