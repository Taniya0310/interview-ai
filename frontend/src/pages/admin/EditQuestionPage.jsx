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

function EditQuestionPage({
  questionId,
  onBack,
  onUpdated,
}) {
  const [form, setForm] = useState({
    interviewType: "",
    role: "",
    difficulty: "beginner",
    text: "",
    expectedTopics: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadQuestion() {
      if (!questionId) {
        setError("No question selected.");
        setLoading(false);
        return;
      }

      try {
        const data = await api(`/questions/${questionId}`);

        setForm({
          interviewType: data.interview_type || data.interviewType || "",
          role: data.role || "",
          difficulty: data.difficulty || "beginner",
          text: data.text || "",
          expectedTopics: Array.isArray(data.expected_topics)
            ? data.expected_topics.join(", ")
            : Array.isArray(data.expectedTopics)
              ? data.expectedTopics.join(", ")
              : "",
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [questionId]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.text.trim()) {
      setError("Please enter a question.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const expectedTopics = form.expectedTopics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);

      await api(`/questions/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewType: form.interviewType.trim(),
          role: form.role.trim(),
          difficulty: form.difficulty.trim(),
          text: form.text.trim(),
          expectedTopics,
        }),
      });

      setSuccess("Question updated successfully.");

      if (onUpdated) {
        onUpdated();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <section className="admin-form-card">
            <p>Loading question...</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-container admin-form-container">

        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">
              QUESTION BANK
            </p>

            <h1>Edit Question</h1>

            <p className="admin-subtitle">
              Update the selected interview question.
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

        <section className="admin-form-card">
          <form onSubmit={handleSubmit}>

            <div className="admin-form-group">
              <label htmlFor="interviewType">
                Interview Type
              </label>

              <input
                id="interviewType"
                name="interviewType"
                value={form.interviewType}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="role">
                Role
              </label>

              <input
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="difficulty">
                Difficulty
              </label>

              <select
                id="difficulty"
                name="difficulty"
                value={form.difficulty}
                onChange={handleChange}
                required
              >
                <option value="beginner">
                  Beginner
                </option>

                <option value="intermediate">
                  Intermediate
                </option>

                <option value="advanced">
                  Advanced
                </option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="text">
                Question
              </label>

              <textarea
                id="text"
                name="text"
                value={form.text}
                onChange={handleChange}
                rows={6}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="expectedTopics">
                Expected Topics
              </label>

              <input
                id="expectedTopics"
                name="expectedTopics"
                value={form.expectedTopics}
                onChange={handleChange}
                placeholder="REST API, HTTP, authentication"
              />

              <span className="admin-field-hint">
                Separate multiple topics with commas.
              </span>
            </div>

            {error && (
              <div className="admin-message admin-message-error">
                {error}
              </div>
            )}

            {success && (
              <div className="admin-message admin-message-success">
                {success}
              </div>
            )}

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={onBack}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

          </form>
        </section>

      </div>
    </main>
  );
}

export default EditQuestionPage;