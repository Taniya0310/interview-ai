import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import PageLoader from "../components/PageLoader";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  UserRoundCheck,
  Home,
  Settings,
  Sparkles,
  Star,
  Sun,
} from "lucide-react";
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
export default function DashboardPage() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayStreak, setDayStreak] = useState(0);
  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        /*
         * Change this endpoint only if your backend
         * uses a different interview-history route.
         */
        const data = await api(
          "/interviews"
        );


        const streakData = await api(
          "/interviews/streak"
        );
        if (!mounted) return;
        setDayStreak(streakData?.streak || 0);
        const interviews = Array.isArray(
          data
        )
          ? data
          : data?.interviews || [];

        setHistory(interviews);
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        if (mounted) {
          setHistory([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  function startInterview() {
    navigate("/interview/setup");
  }

  function openHistory() {
    navigate("/interview/history");
  }

  function openProfile() {
    navigate("/profile");
  }

  function openSettings() {
    navigate("/settings");
  }

  function getScore(interview) {
    return (
      interview?.score ??
      interview?.overall_score ??
      interview?.overallScore ??
      null
    );
  }

  function getStatus(interview) {
    return (
      interview?.status ||
      interview?.state ||
      "completed"
    );
  }

  function getRole(interview) {
    return `Interview ${interview?.interview_number || ""
      }`;
  }

  function getDate(interview) {
    const date =
      interview?.created_at ||
      interview?.createdAt ||
      interview?.started_at;

    if (!date) {
      return "";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  }

  const completedInterviews =
    history.filter(
      (item) =>
        getStatus(item) ===
        "completed" ||
        getStatus(item) ===
        "finished"
    );

  const scores =
    completedInterviews
      .map((item) =>
        Number(getScore(item))
      )
      .filter(
        (score) =>
          Number.isFinite(score) &&
          score > 0
      );

  const averageScore =
    scores.length > 0
      ? Math.round(
        scores.reduce(
          (sum, score) =>
            sum + score,
          0
        ) / scores.length
      )
      : 0;

  const recent =
    history.slice(0, 3);

  return (
    <main className="mobile-page dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <div className="eyebrow">
            SkillzageAI
          </div>

          <h1>
            Ready to practice?
          </h1>

          <p>
            Build confidence with realistic
            AI-powered interviews.
          </p>
        </div>

        <button
          type="button"
          className="profile-btn"
          onClick={openProfile}
          aria-label="Open profile"
        >
          <UserRoundCheck size={23} strokeWidth={1.8} />
        </button>
      </header>

      {/* Main CTA */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="hero-badge">
            AI POWERED
          </span>

          <h2>
            Practice like it's
            <span> the real thing.</span>
          </h2>

          <p>
            Get adaptive questions, real-time
            analysis and personalized feedback
            after every interview.
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={startInterview}
          >
            Start New Interview
            <span>→</span>
          </button>
        </div>

        <div className="dashboard-hero-orb">
          <div className="orb-inner">
            ✦
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple"><BriefcaseBusiness size={22} /></div>
          <span>
            Interviews
          </span>

          <strong>
            {completedInterviews.length}
          </strong>

          <small>
            completed
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><Star size={22} /></div>
          <span>
            Avg. Score
          </span>

          <strong>
            {averageScore || "—"}
          </strong>

          <small>
            out of 100
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><BarChart3 size={22} /></div>
          <span>Day Streak</span>
          <strong>{dayStreak}</strong>
          <small>Keep it up! 🔥</small>
        </div>
      </section>

      {/* Quick actions */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              QUICK ACTIONS
            </span>

            <h2>
              Keep improving
            </h2>
          </div>
        </div>

        <div className="quick-actions">
          <button
            type="button"
            className="quick-action-card"
            onClick={startInterview}
          >
            <div className="quick-icon">
              ✦
            </div>

            <div>
              <strong>
                New Interview
              </strong>

              <span>
                Practice a fresh interview
              </span>
            </div>

            <b>→</b>
          </button>

          <button
            type="button"
            className="quick-action-card"
            onClick={openHistory}
          >
            <div className="quick-icon">
              ◷
            </div>

            <div>
              <strong>
                Interview History
              </strong>

              <span>
                Review your previous attempts
              </span>
            </div>

            <b>→</b>
          </button>
        </div>
      </section>

      {/* Recent Interviews */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              RECENT
            </span>

            <h2>
              Recent interviews
            </h2>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              className="text-btn"
              onClick={openHistory}
            >
              View all
            </button>
          )}
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner" />

            <p>
              Loading your interviews...
            </p>
          </div>
        ) : recent.length > 0 ? (
          <div className="recent-list">
            {recent.map(
              (interview, index) => {
                const score =
                  getScore(interview);

                const status =
                  getStatus(interview);

                const interviewId =
                  interview?.id ||
                  interview?.interview_id;

                return (
                  <button
                    type="button"
                    className="recent-interview-card"
                    key={
                      interviewId ||
                      index
                    }
                    onClick={() => {
                      if (
                        interviewId
                      ) {
                        navigate(
                          "/interview/results",
                          {
                            state: {
                              interviewId,
                            },
                          }
                        );
                      } else {
                        openHistory();
                      }
                    }}
                  >
                    <div className="recent-icon">
                      ◉
                    </div>

                    <div className="recent-content">
                      <strong>
                        {getRole(
                          interview
                        )}
                      </strong>

                      <span>
                        {getDate(
                          interview
                        ) ||
                          "Recent interview"}
                      </span>
                    </div>

                    <div className="recent-score">
                      {score !== null &&
                        score !== undefined ? (
                        <>
                          <strong>
                            {Math.round(
                              Number(
                                score
                              )
                            )}
                          </strong>

                          <small>
                            /100
                          </small>
                        </>
                      ) : (
                        <span className="status-text">
                          {status}
                        </span>
                      )}
                    </div>

                    <span className="recent-arrow">
                      →
                    </span>
                  </button>
                );
              }
            )}
          </div>
        ) : (
          <div className="empty-dashboard">
            <div className="empty-icon">
              ✦
            </div>

            <h3>
              Your first interview
              starts here
            </h3>

            <p>
              Complete an interview to see
              your performance and progress
              here.
            </p>

            <button
              type="button"
              className="secondary-btn"
              onClick={startInterview}
            >
              Start Practicing
            </button>
          </div>
        )}
      </section>

      {/* Bottom navigation */}
      <BottomNav />
    </main>
  );
}
