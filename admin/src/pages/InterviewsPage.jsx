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

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInterviews() {
      try {
        const data = await getInterviews();

        setInterviews(
          Array.isArray(data)
            ? data
            : data.interviews || []
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadInterviews();
  }, []);

  async function handleViewInterview(interviewId) {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await getInterviewById(interviewId);
      setSelectedInterview(data.interview);
    } catch (error) {
      setError(error.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>Interview management</p>
          <h1>Interviews</h1>
        </div>
      </header>

      {loading && <p>Loading interviews...</p>}

      {error && <p className="error">{error}</p>}

      {detailsLoading && <p>Loading interview details...</p>}

      {!loading && !error && (
        <div className="admin-table-wrapper">
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
                  <td>{interview.interview_type || "—"}</td>
                  <td>{interview.role || "—"}</td>
                  <td>{interview.difficulty || "—"}</td>

                  <td>
                    <span className="status-badge">
                      {interview.status || "Unknown"}
                    </span>
                  </td>

                  <td>{formatDate(interview.created_at)}</td>

                  <td>
                    <button
                      type="button"
                      className="admin-table-action"
                      onClick={() =>
                        handleViewInterview(interview.id)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedInterview && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="admin-modal interview-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setSelectedInterview(null)}
            >
              ×
            </button>

            <h2>Interview Details</h2>

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
                label="Status"
                value={selectedInterview.status}
              />

              <Detail
                label="Created at"
                value={formatDate(selectedInterview.created_at)}
              />

              <Detail
                label="Completed at"
                value={formatDate(selectedInterview.completed_at)}
              />
            </div>

            <h3 className="interview-section-title">
              Questions and Answers
            </h3>

            {!selectedInterview.questions ||
            selectedInterview.questions.length === 0 ? (
              <p>No questions found for this interview.</p>
            ) : (
              <div className="interview-questions">
                {selectedInterview.questions.map((question) => (
                  <div
                    className="interview-question-card"
                    key={question.interview_question_id}
                  >
                    <h4>
                      Question {question.position}
                    </h4>

                    <p>
                      {question.question_text || "No question text"}
                    </p>

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

                    <h5>Answers</h5>

                    {!question.answers ||
                    question.answers.length === 0 ? (
                      <p>No answers found.</p>
                    ) : (
                      question.answers.map((answer) => (
                        <div
                          className="interview-answer-card"
                          key={answer.answer_id}
                        >
                          <Detail
                            label="Answer status"
                            value={answer.status}
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
                            label="Created at"
                            value={formatDate(answer.created_at)}
                          />

                          {answer.error_message && (
                            <Detail
                              label="Error"
                              value={answer.error_message}
                            />
                          )}

                          {answer.analysis && (
  <div className="interview-analysis">
    <h5>Analysis Details</h5>

    <div className="analysis-details">
      <FormattedValue
        value={answer.analysis.result}
      />
    </div>

    <Detail
      label="Analysis status"
      value={answer.analysis.status}
    />

    <Detail
      label="Completed at"
      value={formatDate(answer.analysis.completed_at)}
    />
  </div>
)}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
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
        <div className="formatted-field" key={key}>
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
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function Detail({ label, value }) {
  return (
    <div className="admin-detail-item">
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