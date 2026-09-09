import { useEffect, useState } from "react";
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

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const admin = getAdminUser();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardData();
        setDashboard(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <section className="admin-page">
        <div className="admin-card">
          <p>Loading dashboard...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-page">
        <div className="admin-card">
          <p className="error">{error}</p>
        </div>
      </section>
    );
  }

  const statistics = dashboard?.statistics || {};
  const recentUsers = dashboard?.recentUsers || [];
  const recentInterviews = dashboard?.recentInterviews || [];

  return (
    <section className="admin-dashboard-page">
      <header className="admin-page-header">
        <div>
          <p>Welcome back, {admin?.name || admin?.email}</p>
          <h1>Admin Dashboard</h1>
        </div>

        <span className="admin-live-badge">
          System active
        </span>
      </header>

      <div className="admin-stats-grid">
        <article className="admin-stat-card blue">
          <span>Total users</span>
          <strong>{statistics.total_users || 0}</strong>
          <small>Registered users</small>
        </article>

        <article className="admin-stat-card green">
          <span>Verified users</span>
          <strong>{statistics.verified_users || 0}</strong>
          <small>Verified accounts</small>
        </article>

        <article className="admin-stat-card purple">
          <span>Total interviews</span>
          <strong>{statistics.total_interviews || 0}</strong>
          <small>All interview sessions</small>
        </article>

        <article className="admin-stat-card orange">
          <span>Completed interviews</span>
          <strong>{statistics.completed_interviews || 0}</strong>
          <small>Finished sessions</small>
        </article>

        <article className="admin-stat-card cyan">
          <span>Active questions</span>
          <strong>{statistics.active_questions || 0}</strong>
          <small>Available questions</small>
        </article>

        <article className="admin-stat-card red">
          <span>Total analyses</span>
          <strong>{statistics.total_analyses || 0}</strong>
          <small>Generated analyses</small>
        </article>
      </div>

      <div className="admin-dashboard-columns">
        <section className="admin-table-section">
          <div className="admin-section-heading">
            <div>
              <span>USER ACTIVITY</span>
              <h2>Recent users</h2>
            </div>

            <button type="button">View all</button>
          </div>

          <div className="admin-table-wrapper">
            {recentUsers.length === 0 ? (
              <p className="admin-empty">No users found.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td>
                        <strong>
                          {user.full_name || "Unnamed user"}
                        </strong>
                        <small>{user.user_id}</small>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span
                          className={
                            user.is_verified
                              ? "status-badge"
                              : "status-badge inactive"
                          }
                        >
                          {user.is_verified
                            ? "Verified"
                            : "Unverified"}
                        </span>
                      </td>

                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="admin-table-section">
          <div className="admin-section-heading">
            <div>
              <span>INTERVIEW ACTIVITY</span>
              <h2>Recent interviews</h2>
            </div>

            <button type="button">View all</button>
          </div>

          <div className="admin-table-wrapper">
            {recentInterviews.length === 0 ? (
              <p className="admin-empty">
                No interviews found.
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Interview</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentInterviews.map((interview) => (
                    <tr key={interview.id}>
                      <td>
                        <strong>
                          {interview.interview_type ||
                            "Interview"}
                        </strong>
                        <small>{interview.user_id}</small>
                      </td>

                      <td>
                        {interview.role || "—"}
                      </td>

                      <td>
                        <span className="status-badge interview-status">
                          {formatStatus(interview.status)}
                        </span>
                      </td>

                      <td>
                        {formatDate(interview.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}