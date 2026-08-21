import React, { useEffect, useState } from "react";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore invalid response body
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function QuestionsPage({
  onBack,
  onCreate,
  onEdit,
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadQuestions() {
    setLoading(true);
    setError("");

    try {
      const data = await api("/questions?isActive=true");

      setQuestions(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  async function deleteQuestion(questionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(questionId);
    setError("");

    try {
      await api(`/questions/${questionId}`, {
        method: "DELETE",
      });

      await loadQuestions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }

  function getTopics(question) {
    const topics =
      question.expectedTopics ||
      question.expected_topics ||
      [];

    if (Array.isArray(topics)) {
      return topics;
    }

    return [];
  }

  return (
    <main className="admin-page">
      <div className="admin-container">

        {/* Header */}
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">
              QUESTION BANK
            </p>

            <h1>Interview Questions</h1>

            <p className="admin-subtitle">
              Manage the questions used during interviews.
            </p>
          </div>

          <button
            type="button"
            className="admin-back-button"
            onClick={onBack}
          >
            ← Back
          </button>
        </header>

        {/* Toolbar */}
        <section className="admin-toolbar">
          <div>
            <strong>
              {questions.length}
            </strong>

            <span>
              {questions.length === 1
                ? " active question"
                : " active questions"}
            </span>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={onCreate}
          >
            + Create Question
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="admin-message admin-message-error">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <section className="admin-empty-card">
            <div className="admin-loading">
              Loading questions...
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading && questions.length === 0 && !error && (
          <section className="admin-empty-card">
            <div className="admin-empty-icon">
              ?
            </div>

            <h2>No questions yet</h2>

            <p>
              Your question bank is empty. Create your
              first interview question to get started.
            </p>

            <button
              type="button"
              className="admin-primary-button"
              onClick={onCreate}
            >
              Create First Question
            </button>
          </section>
        )}

        {/* Questions */}
        {!loading && questions.length > 0 && (
          <section className="admin-question-list">

            {questions.map((question, index) => {
              const topics = getTopics(question);

              return (
                <article
                  className="admin-question-card"
                  key={question.id}
                >

                  <div className="admin-question-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="admin-question-main">

                    <div className="admin-question-meta">

                      <span className="admin-badge">
                        {question.interviewType ||
                          question.interview_type ||
                          "Technical"}
                      </span>

                      <span className="admin-badge">
                        {question.difficulty ||
                          "Beginner"}
                      </span>

                      <span className="admin-badge">
                        {question.role || "General"}
                      </span>

                    </div>

                    <h2>
                      {question.text}
                    </h2>

                    {topics.length > 0 && (
                      <div className="admin-topic-list">
                        {topics.map((topic, topicIndex) => (
                          <span
                            key={`${question.id}-${topicIndex}`}
                            className="admin-topic"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  <div className="admin-question-actions">

                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() =>
                        onEdit(question.id)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        deleteQuestion(question.id)
                      }
                      disabled={
                        deletingId === question.id
                      }
                    >
                      {deletingId === question.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </article>
              );
            })}

          </section>
        )}

      </div>
    </main>
  );
}

export default QuestionsPage;