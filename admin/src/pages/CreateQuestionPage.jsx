import { useEffect, useState } from "react";
import { createQuestion } from "../services/adminapi";
import { getCategories } from "../services/categoryService";
import { getDomains } from "../services/domainService";

export default function CreateQuestionPage({
  onBack,
  onCreated,
}) {
  const [form, setForm] = useState({
    questionType: "interview",
    domainType: "",
    role: "",
    domain: "",
    difficulty: "beginner",
    text: "",
    expectedTopics: "",
    referenceAnswer: "",
    answerKeyPoints: "",
    categoryId: "",
  });

  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [loadingDomains, setLoadingDomains] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [categoryList, domainList] =
          await Promise.all([
            getCategories(),
            getDomains(),
          ]);

        setCategories(categoryList || []);
        setDomains(domainList || []);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoadingCategories(false);
        setLoadingDomains(false);
      }
    }

    loadOptions();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const updatedForm = {
        ...current,
        [name]: value,
      };

      if (name === "questionType") {
        updatedForm.domainType = "";
        updatedForm.domain = "";
        updatedForm.categoryId = "";
      }

      if (
        name === "domainType" &&
        value === "non_technical"
      ) {
        updatedForm.domain = "";
      }

      if (
        name === "questionType" &&
        value === "training"
      ) {
        updatedForm.domainType = "";
        updatedForm.domain = "";
      }

      return updatedForm;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      form.questionType === "interview" &&
      !form.domainType
    ) {
      setError("Please select a domain type.");
      return;
    }

    if (
      form.questionType === "interview" &&
      form.domainType === "domain_specific" &&
      !form.domain
    ) {
      setError("Please select a domain.");
      return;
    }

    if (
      form.questionType === "training" &&
      !form.categoryId
    ) {
      setError("Please select a training category.");
      return;
    }

    setLoading(true);

    try {
      await createQuestion({
        interviewType: form.questionType,
        role: form.role,
        domain:
          form.questionType === "interview" &&
          form.domainType === "domain_specific"
            ? form.domain
            : null,
        difficulty: form.difficulty,
        text: form.text,
        expectedTopics: form.expectedTopics
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        referenceAnswer: form.referenceAnswer,
        answerKeyPoints: form.answerKeyPoints
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        categoryId:
          form.questionType === "training" &&
          form.categoryId
            ? Number(form.categoryId)
            : null,
      });

      onCreated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const isInterview = form.questionType === "interview";
  const isTraining = form.questionType === "training";
  const isDomainSpecific =
    form.domainType === "domain_specific";

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
          <h1>Create question</h1>
        </div>
      </header>

      <form
        className="admin-card admin-form"
        onSubmit={handleSubmit}
      >
        <label>
          Question type

          <select
            name="questionType"
            value={form.questionType}
            onChange={updateField}
          >
            <option value="interview">Interview</option>
            <option value="training">Training</option>
          </select>
        </label>

        {isInterview && (
          <label>
            Interview category

            <select
              name="domainType"
              value={form.domainType}
              onChange={updateField}
              required
            >
              <option value="">
                Select interview category
              </option>
              <option value="domain_specific">
                Domain specific
              </option>
              <option value="non_technical">
                Non-technical
              </option>
            </select>
          </label>
        )}

        {isDomainSpecific && (
          <label>
            Domain

            <select
              name="domain"
              value={form.domain}
              onChange={updateField}
              disabled={loadingDomains}
              required
            >
              <option value="">
                {loadingDomains
                  ? "Loading domains..."
                  : "Select a domain"}
              </option>

              {domains.map((domain) => (
                <option
                  key={domain.id}
                  value={domain.name}
                >
                  {domain.name}
                </option>
              ))}
            </select>

            <small>
              Select a domain created by the admin.
            </small>
          </label>
        )}

        {isTraining && (
          <label>
            Training category

            <select
              name="categoryId"
              value={form.categoryId}
              onChange={updateField}
              disabled={loadingCategories}
              required
            >
              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "Select a training category"}
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
        )}

        <label>
          Role

          <input
            name="role"
            value={form.role}
            onChange={updateField}
            placeholder="Frontend Developer"
            required
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
            placeholder="Enter the interview question"
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
            placeholder="React, JavaScript, Components"
          />

          <small>Separate items with commas.</small>
        </label>

        <label>
          Reference answer

          <textarea
            name="referenceAnswer"
            value={form.referenceAnswer}
            onChange={updateField}
            rows="5"
            placeholder="Expected answer guidance"
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

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          className="admin-primary-button"
          disabled={loading}
        >
          {loading
            ? "Creating..."
            : "Create question"}
        </button>
      </form>
    </section>
  );
}