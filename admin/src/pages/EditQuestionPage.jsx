import { useEffect, useState } from "react";
import {
  getQuestions,
  updateQuestion,
} from "../services/adminapi";
import { getCategories } from "../services/categoryService";

export default function EditQuestionPage({
  questionId,
  onBack,
  onUpdated,
}) {
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQuestion() {
      try {
        const questions = await getQuestions();

        const question = questions.find(
          (item) =>
            String(item.id) === String(questionId)
        );

        if (!question) {
          throw new Error("Question not found");
        }

        setForm({
          interviewType:
            question.interview_type ||
            question.interviewType ||
            "technical",
          role: question.role || "",
          domain: question.domain || "",
          difficulty: question.difficulty || "beginner",
          text: question.text || "",
          expectedTopics: Array.isArray(
            question.expected_topics
          )
            ? question.expected_topics.join(", ")
            : Array.isArray(question.expectedTopics)
              ? question.expectedTopics.join(", ")
              : "",
          referenceAnswer:
            question.reference_answer ||
            question.referenceAnswer ||
            "",
          answerKeyPoints: Array.isArray(
            question.answer_key_points
          )
            ? question.answer_key_points.join(", ")
            : Array.isArray(question.answerKeyPoints)
              ? question.answerKeyPoints.join(", ")
              : "",
          categoryId:
            question.category_id ??
            question.categoryId ??
            "",
          isActive: question.is_active !== false,
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestion();
  }, [questionId]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getCategories();
        setCategories(result);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  function updateField(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateQuestion(questionId, {
        ...form,
        categoryId: form.categoryId
          ? Number(form.categoryId)
          : null,
        expectedTopics: form.expectedTopics
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        answerKeyPoints: form.answerKeyPoints
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      onUpdated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-page">
        <p>Loading question...</p>
      </section>
    );
  }

  if (!form) {
    return (
      <section className="admin-page">
        <p className="error">
          {error || "Question not found"}
        </p>

        <button
          type="button"
          onClick={onBack}
        >
          Go back
        </button>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <button
        type="button"
        className="admin-back-button"
        onClick={onBack}
      >
        ← Back to questions
      </button>

      <header className="admin-page-header">
        <div>
          <p>Question management</p>
          <h1>Edit question</h1>
        </div>
      </header>

      <form
        className="admin-card admin-form"
        onSubmit={handleSubmit}
      >
        <label>
          Interview type

          <select
            name="interviewType"
            value={form.interviewType}
            onChange={updateField}
          >
            <option value="technical">Technical</option>
            <option value="behavioral">
              Behavioral
            </option>
            <option value="training">Training</option>
          </select>
        </label>

        <label>
          Role

          <input
            name="role"
            value={form.role}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Domain

          <input
            name="domain"
            value={form.domain}
            onChange={updateField}
          />
        </label>

        <label>
          Difficulty

          <select
            name="difficulty"
            value={form.difficulty}
            onChange={updateField}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">
              Intermediate
            </option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <label>
          Question

          <textarea
            name="text"
            value={form.text}
            onChange={updateField}
            rows="5"
            required
          />
        </label>

        <label>
          Expected topics

          <input
            name="expectedTopics"
            value={form.expectedTopics}
            onChange={updateField}
            placeholder="React, JavaScript, APIs"
          />

          <small>
            Separate items with commas.
          </small>
        </label>

        <label>
          Reference answer

          <textarea
            name="referenceAnswer"
            value={form.referenceAnswer}
            onChange={updateField}
            rows="5"
          />
        </label>

        <label>
          Answer key points

          <input
            name="answerKeyPoints"
            value={form.answerKeyPoints}
            onChange={updateField}
            placeholder="Correctness, Clarity, Examples"
          />
        </label>

        <label>
          Training category

          <select
            name="categoryId"
            value={form.categoryId || ""}
            onChange={updateField}
            disabled={loadingCategories}
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : "Select a category"}
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-checkbox">
          <input
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={updateField}
          />

          Active question
        </label>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}