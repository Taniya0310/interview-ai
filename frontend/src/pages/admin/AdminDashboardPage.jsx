import React from "react";

function AdminDashboardPage({
  onQuestions,
  onCreateQuestion,
  onHome,
}) {
  return (
    <main className="admin-page">
      <div className="admin-container">

        {/* Header */}
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">INTERVIEW AI</p>

            <h1>Admin Dashboard</h1>

            <p className="admin-subtitle">
              Manage your interview question bank and
              interview content.
            </p>
          </div>

          <button
            type="button"
            className="admin-back-button"
            onClick={onHome}
          >
            ← Back
          </button>
        </header>

        {/* Stats */}
        <section className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-icon">?</span>

            <div>
              <strong>Question Bank</strong>
              <span>Manage interview questions</span>
            </div>
          </div>

          <div className="admin-stat-card">
            <span className="admin-stat-icon">+</span>

            <div>
              <strong>Create Question</strong>
              <span>Add a new interview question</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <p className="admin-eyebrow">MANAGEMENT</p>
              <h2>Question Bank</h2>
            </div>
          </div>

          <div className="admin-action-grid">

            <button
              type="button"
              className="admin-action-card"
              onClick={onQuestions}
            >
              <div className="admin-action-icon">
                ?
              </div>

              <div className="admin-action-content">
                <h3>View Questions</h3>

                <p>
                  View, manage and delete questions
                  from the interview question bank.
                </p>

                <span className="admin-action-link">
                  Open question bank →
                </span>
              </div>
            </button>

            <button
              type="button"
              className="admin-action-card"
              onClick={onCreateQuestion}
            >
              <div className="admin-action-icon">
                +
              </div>

              <div className="admin-action-content">
                <h3>Create Question</h3>

                <p>
                  Add a new technical interview
                  question to your question bank.
                </p>

                <span className="admin-action-link">
                  Create question →
                </span>
              </div>
            </button>

          </div>
        </section>

        {/* Footer info */}
        <section className="admin-info-card">
          <div className="admin-info-icon">
            i
          </div>

          <div>
            <h3>Admin controls</h3>

            <p>
              Questions added here can be used by the
              interview system when creating interviews.
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}

export default AdminDashboardPage;