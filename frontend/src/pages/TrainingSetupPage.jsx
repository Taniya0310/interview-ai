import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTrainingCategories,
  createTrainingSession,
} from "../services/trainingApi";

export default function TrainingSetupPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory =
    categories.find(
      (category) =>
        String(category.id) === String(categoryId)
    )?.name || "Select category";

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getTrainingCategories();

        setCategories(result);

        if (result.length > 0) {
          setCategoryId(String(result[0].id));
        }
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load training categories."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  async function handleStartTraining() {
    setError("");

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    try {
      setStarting(true);

      const result = await createTrainingSession(
        Number(categoryId)
      );

      navigate("/training/device-check", {
        state: {
          session: result.session,
          questions: result.questions,
          categoryId: Number(categoryId),
        },
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to start training."
      );
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <main className="training-page">
        <section className="training-card">
          <p>Loading categories...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="training-page">
      <section className="training-card">
        <button
          type="button"
          className="training-back"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <p className="eyebrow">VOICE PRACTICE</p>

        <h1>Set up your training</h1>

        <p>
          Choose a practice category and prepare your
          microphone before starting.
        </p>

        <label htmlFor="category">
          Training category
        </label>

        <div className="custom-select-wrapper">
          <button
            type="button"
            id="category"
            className="custom-select-trigger"
            onClick={() =>
              setCategoryOpen((open) => !open)
            }
            disabled={starting}
          >
            <span>{selectedCategory}</span>
            <span className="custom-select-arrow">
              ⌄
            </span>
          </button>

          {categoryOpen && (
            <div className="custom-select-menu">
              {categories.map((category) => {
                const isSelected =
                  String(categoryId) ===
                  String(category.id);

                return (
                  <button
                    type="button"
                    key={category.id}
                    className="custom-select-option"
                    onClick={() => {
                      setCategoryId(
                        String(category.id)
                      );
                      setCategoryOpen(false);
                    }}
                  >
                    <span>{category.name}</span>

                    <span
                      className={`category-radio ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="training-setup-info">
          <strong>How it works</strong>

          <p>
            First, we will check your microphone. Then
            the question will be spoken aloud and you can
            answer using your voice.
          </p>
        </div>

        {error && (
          <p className="training-error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="training-start-button"
          disabled={
            starting || categories.length === 0
          }
          onClick={handleStartTraining}
        >
          {starting
            ? "Preparing Training..."
            : "Continue to Microphone Check"}
        </button>
      </section>
    </main>
  );
}