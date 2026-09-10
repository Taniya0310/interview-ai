import { useEffect, useState } from "react";
import {
  getInterviews,
  getInterviewById,
} from "../services/interviewService";

function formatDate(value) {
  if (!value) return "Not provided";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status) {
  return String(status || "not_started")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function getAnalysisSummary(interview) {
  const summary = {
    completed: 0,
    processing: 0,
    failed: 0,
    not_started: 0,
    total: 0,
  };

  interview?.questions?.forEach((question) => {
    question.answers?.forEach((answer) => {
      summary.total += 1;

      const status =
        answer.analysis?.status || "not_started";

      if (summary[status] !== undefined) {
        summary[status] += 1;
      } else {
        summary.not_started += 1;
      }
    });
  });

  return summary;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] =
    useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    async function loadInterviews() {
      setLoading(true);
      setError("");

      try {
        const data = await getInterviews({
          page,
          limit,
        });

        const interviewList = Array.isArray(data)
          ? data
          : data?.interviews || [];

        setInterviews(interviewList);

        setPagination(
          data?.pagination || {
            page,
            limit,
            total: interviewList.length,
            totalPages: 1,
          },
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadInterviews();
  }, [page, limit]);

  async function handleViewInterview(interviewId) {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await getInterviewById(interviewId);
      setSelectedInterview(data.interview);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  const analysisSummary =
    getAnalysisSummary(selectedInterview);

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>Interview management</p>
          <h1>Interviews</h1>
          <span>
            {pagination.total} total interviews
          </span>
        </div>
      </header>

      {loading && <p>Loading interviews...</p>}

      {error && <p className="error">{error}</p>}

      {detailsLoading && (
        <p>Loading interview details...</p>
      )}

      {!loading && !error && (
        <>
          <div className="admin-table-wrapper">
            {interviews.length === 0 ? (
              <p className="admin-empty">
                No interviews found.
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Interview ID</th>
                    <th>User ID</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview.id}>
                      <td>{interview.id}</td>
                      <td>{interview.user_id || "—"}</td>
                      <td>
                        {interview.interview_type || "—"}
                      </td>
                      <td>{interview.role || "—"}</td>
                      <td>
                        {interview.difficulty || "—"}
                      </td>

                      <td>
                        <span className="status-badge">
                          {formatStatus(
                            interview.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(interview.created_at)}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() =>
                            handleViewInterview(
                              interview.id,
                            )
                          }
                        >
                          View analytics
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination-controls">
              <button
                type="button"
                className="admin-secondary-button"
                disabled={page === 1 || loading}
                onClick={() =>
                  setPage(
                    (currentPage) => currentPage - 1,
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                className="admin-secondary-button"
                disabled={
                  page === pagination.totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (currentPage) => currentPage + 1,
                  )
                }
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedInterview && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="admin-modal interview-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setSelectedInterview(null)}
            >
              ×
            </button>

            <h2>Interview Analytics</h2>

            <div className="admin-details-grid">
              <Detail
                label="Interview ID"
                value={selectedInterview.id}
              />

              <Detail
                label="User ID"
                value={selectedInterview.user_id}
              />

              <Detail
                label="Interview type"
                value={selectedInterview.interview_type}
              />

              <Detail
                label="Role"
                value={selectedInterview.role}
              />

              <Detail
                label="Difficulty"
                value={selectedInterview.difficulty}
              />

              <Detail
                label="Interview status"
                value={formatStatus(
                  selectedInterview.status,
                )}
              />

              <Detail
                label="Created at"
                value={formatDate(
                  selectedInterview.created_at,
                )}
              />

              <Detail
                label="Completed at"
                value={formatDate(
                  selectedInterview.completed_at,
                )}
              />
            </div>

            <section className="interview-analytics">
              <div className="analytics-header">
                <div>
                  <p>GEMINI ANALYTICS</p>
                  <h3>Analysis processing status</h3>
                </div>

                <strong>
                  {analysisSummary.total} answers
                </strong>
              </div>

              <div className="analytics-cards">
                <AnalyticsCard
                  label="Completed"
                  value={analysisSummary.completed}
                  tone="completed"
                />

                <AnalyticsCard
                  label="Processing"
                  value={analysisSummary.processing}
                  tone="processing"
                />

                <AnalyticsCard
                  label="Failed"
                  value={analysisSummary.failed}
                  tone="failed"
                />

                <AnalyticsCard
                  label="Not started"
                  value={analysisSummary.not_started}
                  tone="not-started"
                />
              </div>

              <div className="analytics-chart">
                <h4>Gemini analysis distribution</h4>

                <AnalyticsBar
                  label="Completed"
                  value={analysisSummary.completed}
                  total={analysisSummary.total}
                  tone="completed"
                />

                <AnalyticsBar
                  label="Processing"
                  value={analysisSummary.processing}
                  total={analysisSummary.total}
                  tone="processing"
                />

                <AnalyticsBar
                  label="Failed"
                  value={analysisSummary.failed}
                  total={analysisSummary.total}
                  tone="failed"
                />

                <AnalyticsBar
                  label="Not started"
                  value={analysisSummary.not_started}
                  total={analysisSummary.total}
                  tone="not-started"
                />
              </div>
            </section>

            <h3 className="interview-section-title">
              Question-by-question analytics
            </h3>

            {!selectedInterview.questions ||
            selectedInterview.questions.length === 0 ? (
              <p>No questions found.</p>
            ) : (
              <div className="interview-questions">
                {selectedInterview.questions.map(
                  (question) => (
                    <div
                      className="interview-question-card"
                      key={
                        question.interview_question_id
                      }
                    >
                      <h4>
                        Question {question.position}
                      </h4>

                      <p>
                        {question.question_text ||
                          "No question text"}
                      </p>

                      <Detail
                        label="Expected topics"
                        value={
                          Array.isArray(
                            question.expected_topics,
                          )
                            ? question.expected_topics.join(
                                ", ",
                              )
                            : question.expected_topics
                        }
                      />

                      <Detail
                        label="Follow-up count"
                        value={question.follow_up_count}
                      />

                      <Detail
                        label="Satisfied"
                        value={
                          question.is_satisfied
                            ? "Yes"
                            : "No"
                        }
                      />

                      <h5>Answers and Gemini analysis</h5>

                      {!question.answers ||
                      question.answers.length === 0 ? (
                        <p>No answers found.</p>
                      ) : (
                        question.answers.map(
                          (answer) => (
                            <div
                              className="interview-answer-card"
                              key={answer.answer_id}
                            >
                              <Detail
                                label="Answer status"
                                value={formatStatus(
                                  answer.status,
                                )}
                              />

                              <Detail
                                label="Answer type"
                                value={
                                  answer.is_follow_up
                                    ? "Follow-up"
                                    : "Main answer"
                                }
                              />

                              <Detail
                                label="Answer created"
                                value={formatDate(
                                  answer.created_at,
                                )}
                              />

                              {answer.error_message && (
                                <div className="analysis-error">
                                  <strong>
                                    Answer error
                                  </strong>
                                  <p>
                                    {answer.error_message}
                                  </p>
                                </div>
                              )}

                              {answer.analysis ? (
                                <div className="interview-analysis">
                                  <div className="analysis-header">
                                    <h5>
                                      Gemini Analysis
                                    </h5>

                                    <span
                                      className={`status-badge gemini-status ${
                                        answer.analysis
                                          .status ||
                                        "not_started"
                                      }`}
                                    >
                                      {formatStatus(
                                        answer.analysis
                                          .status,
                                      )}
                                    </span>
                                  </div>

                                  <Detail
                                    label="Analysis created"
                                    value={formatDate(
                                      answer.analysis
                                        .created_at,
                                    )}
                                  />

                                  <Detail
                                    label="Analysis completed"
                                    value={formatDate(
                                      answer.analysis
                                        .completed_at,
                                    )}
                                  />

                                  {answer.analysis
                                    .status ===
                                    "failed" && (
                                    <div className="analysis-error">
                                      <strong>
                                        Gemini error
                                      </strong>

                                      <p>
                                        {answer.error_message ||
                                          "Analysis failed without an error message."}
                                      </p>
                                    </div>
                                  )}

                                  {answer.analysis
                                    .result && (
                                    <div className="analysis-details">
                                      <h5>
                                        Full Gemini result
                                      </h5>

                                      <FormattedValue
                                        value={
                                          answer.analysis
                                            .result
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="analysis-not-available">
                                  Gemini analysis has not
                                  been generated.
                                </div>
                              )}
                            </div>
                          ),
                        )
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AnalyticsCard({ label, value, tone }) {
  return (
    <div className={`analytics-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AnalyticsBar({
  label,
  value,
  total,
  tone,
}) {
  const percentage = total
    ? Math.round((value / total) * 100)
    : 0;

  return (
    <div className="analytics-bar-row">
      <div className="analytics-bar-label">
        <span>{label}</span>

        <strong>
          {value} ({percentage}%)
        </strong>
      </div>

      <div className="analytics-bar-track">
        <span
          className={tone}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FormattedValue({ value }) {
  if (value === null || value === undefined) {
    return <span>Not provided</span>;
  }

  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }

  if (typeof value !== "object") {
    return <span>{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <ul className="formatted-list">
        {value.map((item, index) => (
          <li key={index}>
            <FormattedValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="formatted-object">
      {Object.entries(value).map(([key, item]) => (
        <div
          className="formatted-field"
          key={key}
        >
          <span className="formatted-label">
            {formatLabel(key)}
          </span>

          <div className="formatted-value">
            <FormattedValue value={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatLabel(value) {
  return value
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function Detail({ label, value }) {
  const tone = /status/i.test(label)
    ? "status"
    : /satisfied/i.test(label)
    ? "success"
    : /error/i.test(label)
    ? "error"
    : "default";

  return (
    <div className={`admin-detail-item detail-${tone}`}>
      <span>{label}</span>

      <strong>
        {value === null ||
        value === undefined ||
        value === ""
          ? "Not provided"
          : String(value)}
      </strong>
    </div>
  );
}
