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
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (
    value === "completed" ||
    value === "verified" ||
    value === "active"
  ) {
    return "success";
  }

  if (
    value === "cancelled" ||
    value === "failed" ||
    value === "inactive"
  ) {
    return "danger";
  }

  return "warning";
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
      setError(
        requestError.message ||
          "Failed to load dashboard",
      );
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
  const recentInterviews =
    dashboard?.recentInterviews || [];

  const interviewStatusData = useMemo(() => {
    const counts = {};

    recentInterviews.forEach((interview) => {
      const status = interview.status || "unknown";
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts);
  }, [recentInterviews]);

  if (loading) {
    return (
      <section className="admin-page">
        <div className="dashboard-loading-card">
          <div className="dashboard-spinner" />
          <p>Loading admin dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <div className="dashboard-error-card">
          <h2>Unable to load dashboard</h2>
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
            ADMINISTRATION CENTER
          </p>

          <h1>
            Good day,{" "}
            {admin?.name ||
              admin?.email ||
              "Administrator"}
          </h1>

          <p>
            Monitor your platform activity and manage
            operations from one place.
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
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="dashboard-stat-grid">
        <StatCard
          label="Total users"
          value={statistics.total_users}
          caption="Registered accounts"
          icon="US"
          tone="blue"
        />

        <StatCard
          label="Verified users"
          value={statistics.verified_users}
          caption="Verified accounts"
          icon="✓"
          tone="green"
        />

        <StatCard
          label="Total interviews"
          value={statistics.total_interviews}
          caption="All sessions"
          icon="IN"
          tone="purple"
        />

        <StatCard
          label="Completed interviews"
          value={statistics.completed_interviews}
          caption="Finished sessions"
          icon="OK"
          tone="orange"
        />

        <StatCard
          label="Active questions"
          value={statistics.active_questions}
          caption="Available questions"
          icon="Q"
          tone="cyan"
        />

        <StatCard
          label="Total analyses"
          value={statistics.total_analyses}
          caption="Generated reports"
          icon="AI"
          tone="red"
        />
      </div>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                OVERVIEW
              </p>
              <h2>Interview activity</h2>
            </div>

            <span className="dashboard-panel-meta">
              Recent activity
            </span>
          </div>

          {interviewStatusData.length === 0 ? (
            <div className="dashboard-empty">
              No interview activity available.
            </div>
          ) : (
            <div className="dashboard-status-list">
              {interviewStatusData.map(
                ([status, count]) => {
                  const total =
                    recentInterviews.length || 1;

                  const percentage = Math.round(
                    (count / total) * 100,
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

                        <strong>
                          {formatStatus(status)}
                        </strong>

                        <span>{count}</span>
                      </div>

                      <div className="dashboard-progress">
                        <span
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <small>{percentage}%</small>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <p className="dashboard-panel-label">
                QUICK SUMMARY
              </p>
              <h2>System health</h2>
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
              value={`${statistics.active_questions || 0} active`}
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
          </div>

          {recentUsers.length === 0 ? (
            <div className="dashboard-empty">
              No users found.
            </div>
          ) : (
            <div className="dashboard-record-list">
              {recentUsers.slice(0, 5).map((user) => (
                <div
                  className="dashboard-record"
                  key={user.user_id}
                >
                  <div className="dashboard-avatar">
                    {String(
                      user.full_name ||
                        user.email ||
                        "U",
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="dashboard-record-main">
                    <strong>
                      {user.full_name ||
                        "Unnamed user"}
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
                      {user.is_verified
                        ? "Verified"
                        : "Pending"}
                    </span>

                    <small>
                      {formatDate(user.created_at)}
                    </small>
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
              {recentInterviews
                .slice(0, 5)
                .map((interview) => (
                  <div
                    className="dashboard-record"
                    key={interview.id}
                  >
                    <div className="dashboard-avatar interview">
                      IN
                    </div>

                    <div className="dashboard-record-main">
                      <strong>
                        {interview.role ||
                          "Interview session"}
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
                        {formatStatus(
                          interview.status,
                        )}
                      </span>

                      <small>
                        {formatDate(
                          interview.created_at,
                        )}
                      </small>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  caption,
  icon,
  tone,
}) {
  return (
    <article
      className={`dashboard-stat-card ${tone}`}
    >
      <div className="dashboard-stat-top">
        <span>{label}</span>
        <div className="dashboard-stat-icon">
          {icon}
        </div>
      </div>

      <strong>{value || 0}</strong>
      <small>{caption}</small>
    </article>
  );
}

function HealthRow({ label, value, status }) {
  return (
    <div className="dashboard-health-row">
      <div>
        <span
          className={`status-dot ${status}`}
        />
        <strong>{label}</strong>
      </div>

      <span>{value}</span>
    </div>
  );
}