import React, { useState } from "react";

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

function CreateQuestionPage({
  onBack,
  onCreated,
}) {
  const [form, setForm] = useState({
    interviewType: "technical",
    role: "backend-developer",
    difficulty: "beginner",
    text: "",
    expectedTopics: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const expectedTopics = form.expectedTopics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);

      await api("/questions", {
        method: "POST",
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

      setSuccess("Question created successfully.");

      setForm({
        interviewType: "technical",
        role: "backend-developer",
        difficulty: "beginner",
        text: "",
        expectedTopics: "",
      });

      if (onCreated) {
        onCreated();
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-container admin-form-container">

        {/* Header */}
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">
              QUESTION BANK
            </p>

            <h1>Create Question</h1>

            <p className="admin-subtitle">
              Add a new question to your interview
              question bank.
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

        {/* Form Card */}
        <section className="admin-form-card">

          <form onSubmit={handleSubmit}>

            {/* Interview Type */}
            <div className="admin-form-group">
              <label htmlFor="interviewType">
                Interview Type
              </label>

              <input
                id="interviewType"
                name="interviewType"
                type="text"
                value={form.interviewType}
                onChange={handleChange}
                placeholder="technical"
                required
              />
            </div>

            {/* Role */}
            <div className="admin-form-group">
              <label htmlFor="role">
                Role
              </label>

              <input
                id="role"
                name="role"
                type="text"
                value={form.role}
                onChange={handleChange}
                placeholder="backend-developer"
                required
              />
            </div>

            {/* Difficulty */}
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

            {/* Question */}
            <div className="admin-form-group">
              <label htmlFor="text">
                Question
              </label>

              <textarea
                id="text"
                name="text"
                value={form.text}
                onChange={handleChange}
                placeholder="Enter the interview question..."
                rows={6}
                required
              />

              <span className="admin-field-hint">
                Write a clear question that the candidate
                can answer verbally.
              </span>
            </div>

            {/* Expected Topics */}
            <div className="admin-form-group">
              <label htmlFor="expectedTopics">
                Expected Topics
              </label>

              <input
                id="expectedTopics"
                name="expectedTopics"
                type="text"
                value={form.expectedTopics}
                onChange={handleChange}
                placeholder="REST API, HTTP, authentication"
              />

              <span className="admin-field-hint">
                Separate multiple topics with commas.
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="admin-message admin-message-error">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="admin-message admin-message-success">
                {success}
              </div>
            )}

            {/* Actions */}
            <div className="admin-form-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={onBack}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Create Question"}
              </button>

            </div>

          </form>
        </section>

      </div>
    </main>
  );
}

export default CreateQuestionPage;