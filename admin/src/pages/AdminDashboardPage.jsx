import { useEffect, useMemo, useState } from "react";
import { getDashboardData } from "../services/dashboardService";
import { getAdminUser } from "../services/authService";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  return String(status || "unknown")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (["completed", "verified", "active"].includes(value)) {
    return "success";
  }

  if (["cancelled", "failed", "inactive"].includes(value)) {
    return "danger";
  }

  return "warning";
}

function getPercentage(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const admin = getAdminUser();

  async function loadDashboard(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getDashboardData();
      setDashboard(data);
    } catch (requestError) {
      setError(requestError.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const statistics = dashboard?.statistics || {};
  const recentUsers = dashboard?.recentUsers || [];
  const recentInterviews = dashboard?.recentInterviews || [];
  const recentAnalyses = dashboard?.recentAnalyses || [];

  const totalUsers = Number(statistics.total_users || 0);
  const verifiedUsers = Number(statistics.verified_users || 0);
  const totalInterviews = Number(statistics.total_interviews || 0);
  const completedInterviews = Number(
    statistics.completed_interviews || 0,
  );
  const totalAnalyses = Number(statistics.total_analyses || 0);
  const activeQuestions = Number(statistics.active_questions || 0);

  const pendingUsers = Math.max(totalUsers - verifiedUsers, 0);
  const unfinishedInterviews = Math.max(
    totalInterviews - completedInterviews,
    0,
  );

  const interviewStatusData = useMemo(() => {
    const counts = {};

    recentInterviews.forEach((interview) => {
      const status = interview.status || "unknown";
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [recentInterviews]);

  const analytics = [
    {
      label: "User verification rate",
      value: getPercentage(verifiedUsers, totalUsers),
      caption: `${verifiedUsers} verified of ${totalUsers} users`,
      tone: "green",
    },
    {
      label: "Interview completion rate",
      value: getPercentage(
        completedInterviews,
        totalInterviews,
      ),
      caption: `${completedInterviews} completed of ${totalInterviews}`,
      tone: "purple",
    },
    {
      label: "Analysis coverage",
      value: getPercentage(totalAnalyses, totalInterviews),
      caption: `${totalAnalyses} reports generated`,
      tone: "orange",
    },
  ];

  if (loading) {
    return (
      <section className="admin-page">
        <div className="dashboard-loading-card">
          <div className="dashboard-spinner" />
          <p>Loading analytics dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <div className="dashboard-error-card">
          <h2>Unable to load analytics</h2>
          <p>{error}</p>

          <button
            type="button"
            className="admin-primary-button"
            onClick={() => loadDashboard()}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">
            ADMIN ANALYTICS CENTER
          </p>

          <h1>
            Good day,{" "}
            {admin?.name || admin?.email || "Administrator"}
          </h1>

          <p>
            Monitor users, interviews, AI analysis, and platform
            performance from one place.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <span className="admin-live-badge">
            <span className="live-dot" />
            System active
          </span>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh data"}
          </button>
        </div>
      </header>

      <div className="dashboard-stat-grid">
        <StatCard
          label="Total users"
          value={totalUsers}
          caption="Registered accounts"
          icon="US"
          tone="blue"
        />

        <StatCard
          label="Verified users"
          value={verifiedUsers}
          caption={`${pendingUsers} pending verification`}
          icon="✓"
          tone="green"
        />

        <StatCard
          label="Total interviews"
          value={totalInterviews}
          caption="All interview sessions"
          icon="IN"
          tone="purple"
        />

        <StatCard
          label="Completed interviews"
          value={completedInterviews}
          caption={`${unfinishedInterviews} unfinished sessions`}
          icon="OK"
          tone="orange"
        />

        <StatCard
          label="Active questions"
          value={activeQuestions}
          caption="Available questions"
          icon="Q"
          tone="cyan"
        />

        <StatCard
          label="Generated analyses"
          value={totalAnalyses}
          caption="AI reports created"
          icon="AI"
          tone="red"
        />
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <p className="dashboard-panel-label">
              PLATFORM PERFORMANCE
            </p>
            <h2>Analytics overview</h2>
          </div>

          <span className="dashboard-panel-meta">
            Based on current platform data
          </span>
        </div>

        <div className="dashboard-analytics-grid">
          {analytics.map((item) => (
            <div
              className={`dashboard-analytics-card ${item.tone}`}
              key={item.label}
            >
              <div className="dashboard-analytics-header">
                <strong>{item.label}</strong>
                <span>{item.value}%</span>
              </div>

              <div className="dashboard-progress">
                <span
                  style={{
                    width: `${item.value}%`,
                  }}
                />
              </div>

              <small>{item.caption}</small>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                INTERVIEW ANALYTICS
              </p>
              <h2>Interview status distribution</h2>
            </div>

            <span className="dashboard-panel-meta">
              {recentInterviews.length} recent sessions
            </span>
          </div>

          {interviewStatusData.length === 0 ? (
            <div className="dashboard-empty">
              No interview activity available.
            </div>
          ) : (
            <div className="dashboard-status-list">
              {interviewStatusData.map(([status, count]) => {
                const value = getPercentage(
                  count,
                  recentInterviews.length,
                );

                return (
                  <div
                    className="dashboard-status-row"
                    key={status}
                  >
                    <div className="dashboard-status-title">
                      <span
                        className={`status-dot ${getStatusClass(
                          status,
                        )}`}
                      />

                      <strong>{formatStatus(status)}</strong>
                      <span>{count}</span>
                    </div>

                    <div className="dashboard-progress">
                      <span
                        style={{
                          width: `${value}%`,
                        }}
                      />
                    </div>

                    <small>{value}%</small>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                SYSTEM HEALTH
              </p>
              <h2>Service overview</h2>
            </div>
          </div>

          <div className="dashboard-health-list">
            <HealthRow
              label="Database"
              value="Connected"
              status="success"
            />

            <HealthRow
              label="Admin service"
              value="Operational"
              status="success"
            />

            <HealthRow
              label="Question bank"
              value={`${activeQuestions} active`}
              status="success"
            />

            <HealthRow
              label="Analysis engine"
              value="Available"
              status="success"
            />
          </div>
        </section>
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                USER ACTIVITY
              </p>
              <h2>Recent users</h2>
            </div>

            <span className="dashboard-panel-meta">
              {pendingUsers} pending
            </span>
          </div>

          {recentUsers.length === 0 ? (
            <div className="dashboard-empty">
              No users found.
            </div>
          ) : (
            <div className="dashboard-record-list">
              {recentUsers.slice(0, 6).map((user) => (
                <div
                  className="dashboard-record"
                  key={user.user_id}
                >
                  <div className="dashboard-avatar">
                    {String(user.full_name || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="dashboard-record-main">
                    <strong>
                      {user.full_name || "Unnamed user"}
                    </strong>

                    <span>{user.email}</span>
                  </div>

                  <div className="dashboard-record-side">
                    <span
                      className={`dashboard-status-badge ${
                        user.is_verified
                          ? "success"
                          : "warning"
                      }`}
                    >
                      {user.is_verified ? "Verified" : "Pending"}
                    </span>

                    <small>{formatDate(user.created_at)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                INTERVIEW ACTIVITY
              </p>
              <h2>Recent interviews</h2>
            </div>
          </div>

          {recentInterviews.length === 0 ? (
            <div className="dashboard-empty">
              No interviews found.
            </div>
          ) : (
            <div className="dashboard-record-list">
              {recentInterviews.slice(0, 6).map((interview) => (
                <div
                  className="dashboard-record"
                  key={interview.id}
                >
                  <div className="dashboard-avatar interview">
                    IN
                  </div>

                  <div className="dashboard-record-main">
                    <strong>
                      {interview.role || "Interview session"}
                    </strong>

                    <span>
                      {interview.interview_type ||
                        "General interview"}
                    </span>
                  </div>

                  <div className="dashboard-record-side">
                    <span
                      className={`dashboard-status-badge ${getStatusClass(
                        interview.status,
                      )}`}
                    >
                      {formatStatus(interview.status)}
                    </span>

                    <small>
                      {formatDate(interview.created_at)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {recentAnalyses.length > 0 && (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                AI ANALYSIS
              </p>
              <h2>Recent generated reports</h2>
            </div>
          </div>

          <div className="dashboard-record-list">
            {recentAnalyses.slice(0, 6).map((analysis) => (
              <div
                className="dashboard-record"
                key={analysis.id}
              >
                <div className="dashboard-avatar">AI</div>

                <div className="dashboard-record-main">
                  <strong>
                    {analysis.title ||
                      analysis.question ||
                      "Interview analysis"}
                  </strong>

                  <span>
                    {analysis.user_email ||
                      analysis.user_name ||
                      "User analysis"}
                  </span>
                </div>

                <div className="dashboard-record-side">
                  <span
                    className={`dashboard-status-badge ${getStatusClass(
                      analysis.status || "completed",
                    )}`}
                  >
                    {formatStatus(
                      analysis.status || "completed",
                    )}
                  </span>

                  <small>
                    {formatDate(analysis.created_at)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function StatCard({ label, value, caption, icon, tone }) {
  return (
    <article className={`dashboard-stat-card ${tone}`}>
      <div className="dashboard-stat-top">
        <span>{label}</span>

        <div className="dashboard-stat-icon">{icon}</div>
      </div>

      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}

function HealthRow({ label, value, status }) {
  return (
    <div className="dashboard-health-row">
      <div>
        <span className={`status-dot ${status}`} />
        <strong>{label}</strong>
      </div>

      <span>{value}</span>
    </div>
  );
}