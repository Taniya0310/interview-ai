import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness} from "lucide-react";

import {
  getTrainingCategories,
  createTrainingSession,
} from "../services/trainingApi";

const AI_VOICES = [
  {
    id: "ryan",
    label: "Ryan",
    gender: "Male",
  },
  {
    id: "female",
    label: "Female",
    gender: "Female",
  },
];

export default function TrainingSetupPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [voiceId, setVoiceId] = useState("ryan");

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
function previewVoice(voiceId) {
  const text =
    "Hello, I will be talking to you during your session.";

  const nativeTts = window.AndroidTTS;

  if (nativeTts?.speakChunkWithVoice) {
    if (!nativeTts.isReady?.()) {
      setError(
        "Voice models are still preparing. Please try again shortly."
      );
      return;
    }

    nativeTts.stop?.();
    nativeTts.clearQueue?.();

    nativeTts.speakChunkWithVoice(
      text,
      `preview-${voiceId}`,
      voiceId,
      0.9,
      1,
      1
    );

    return;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }
}
  async function handleStartTraining() {
    setError("");

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!voiceId) {
      setError("Please select a voice.");
      return;
    }

    try {
      setStarting(true);

      const result = await createTrainingSession(
        Number(categoryId),
        voiceId
      );
sessionStorage.setItem(
  "trainingVoiceId",
  voiceId
);
      navigate("/training/device-check", {
        state: {
          session: result.session,
          questions: result.questions,
          categoryId: Number(categoryId),
          voiceId,
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
          Choose a practice category and voice before
          starting your training.
        </p>

        <label htmlFor="category">
          Training category
        </label>

        <div className="custom-select-wrapper">
          <button
            type="button"
            id="category"
            className="custom-select-trigger"
            aria-expanded={categoryOpen}
            aria-haspopup="listbox"
            onClick={() =>
              setCategoryOpen((open) => !open)
            }
            disabled={starting}
          >
            <span className="custom-select-value">
              <span className="custom-select-leading-icon">
                <BriefcaseBusiness
                  size={17}
                  strokeWidth={2}
                />
              </span>

              <span>{selectedCategory}</span>
            </span>

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
                        isSelected ? "selected" : ""
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

        <label htmlFor="voice">
          Training voice
        </label>

       <div className="setup-option-grid">
  {AI_VOICES.map((voice) => (
    <div
      key={voice.id}
      className={
        voiceId === voice.id
          ? "setup-option active"
          : "setup-option"
      }
    >
      <button
        type="button"
        className="voice-select-button"
        onClick={() => setVoiceId(voice.id)}
        disabled={starting}
      >
        <span className="setup-option-icon">
          {voice.id === "female" ? "♀" : "♂"}
        </span>

        <span className="setup-option-content">
          <strong>{voice.label}</strong>
          <small>{voice.gender} voice</small>
        </span>

        <span className="setup-option-check">
          {voiceId === voice.id ? "✓" : ""}
        </span>
      </button>

      <button
        type="button"
        className="voice-preview-button"
        onClick={() => previewVoice(voice.id)}
        disabled={starting}
      >
        Hear voice
      </button>
    </div>
  ))}
</div>

        <div className="training-setup-info">
          <strong>How it works</strong>

          <p>
            First, we will check your microphone. Then
            your selected voice will speak the question
            aloud.
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
            starting ||
            categories.length === 0 ||
            !voiceId
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