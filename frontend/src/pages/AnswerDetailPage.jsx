import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authenticatedFetch } from "../services/authApi";
const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function api(path, options = {}) {
  return authenticatedFetch(path, options);
}

function getScore(answer) {
  const value =
    answer?.score ??
    answer?.result?.score ??
    answer?.evaluation?.score ??
    answer?.analysis?.score ??
    null;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    const metrics = answer?.result ?? answer?.evaluation ?? answer?.analysis ?? {};
    const values = ["technicalCorrectness", "relevance", "communication", "structure", "speakingBehavior", "presentation"]
      .map((key) => Number(metrics[key]))
      .filter((item) => Number.isFinite(item));
    return values.length ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length) : null;
  }

  const score = Number(value);

  return Number.isFinite(score)
    ? Math.round(score)
    : null;
}

function getQuestion(answer) {
  return (
    answer?.question ??
    answer?.question_text ??
    answer?.questionText ??
    answer?.interview_question?.text ??
    answer?.interviewQuestion?.text ??
    answer?.text ??
    "Interview Question"
  );
}

function getAnswerText(answer) {
  return (
    answer?.answer ??
    answer?.answer_text ??
    answer?.answerText ??
    answer?.transcript ??
    answer?.transcription ??
    answer?.result?.answer ??
    answer?.result?.transcript ??
    ""
  );
}

function getFeedback(answer) {
  return (
    answer?.feedback ??
    answer?.result?.feedback ??
    answer?.evaluation?.feedback ??
    answer?.analysis?.feedback ??
    ""
  );
}

function getStrengths(answer) {
  const value =
    answer?.strengths ??
    answer?.result?.strengths ??
    answer?.evaluation?.strengths ??
    [];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function getImprovements(answer) {
  const value =
    answer?.weak_areas ??
    answer?.weakAreas ??
    answer?.areas_to_improve ??
    answer?.areasToImprove ??
    answer?.result?.weak_areas ??
    answer?.result?.weakAreas ??
    answer?.evaluation?.improvements ??
    [];

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function getRecommendations(answer) {
  const value = answer?.recommendations ?? answer?.result?.recommendations ?? [];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function getSpeechMetrics(answer) {
  return answer?.speechMetrics ?? answer?.result?.speechMetrics ?? {};
}

function getEvaluationScores(answer) {
  const source = answer?.result ?? answer?.evaluation ?? answer?.analysis ?? answer ?? {};
  return Object.fromEntries(["technicalCorrectness", "relevance", "communication", "structure", "speakingBehavior", "presentation"].filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}

function getVideoUrl(answer) {
  return (
    answer?.video_url ??
    answer?.videoUrl ??
    answer?.video ??
    answer?.media_url ??
    answer?.mediaUrl ??
    null
  );
}

function getScoreLabel(score) {
  if (score === null) {
    return "Not scored";
  }

  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 50) {
    return "Needs improvement";
  }

  return "Keep practicing";
}

function getScoreClass(score) {
  if (score === null) {
    return "";
  }

  if (score >= 85) {
    return "score-excellent";
  }

  if (score >= 70) {
    return "score-good";
  }

  if (score >= 50) {
    return "score-average";
  }

  return "score-low";
}

export default function AnswerDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [answer, setAnswer] = useState(
    location.state?.answer || null
  );

  const [loading, setLoading] = useState(
    !location.state?.answer
  );

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAnswer() {
      if (!id) {
        setLoading(false);
        setError("Answer ID is missing.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        /*
         * Primary endpoint.
         *
         * If your backend exposes a different answer
         * detail endpoint, change only this path.
         */
        const data = await api(
          `/answers/${id}`
        );

        if (!mounted) return;

        setAnswer(
          data?.answer ||
          data?.data ||
          data
        );
      } catch (err) {
        console.error(
          "Answer detail error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load this answer."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (!answer) {
      loadAnswer();
    }

    return () => {
      mounted = false;
    };
  }, [id, answer]);

  function handleBack() {
    navigate(-1);
  }

  function handleResults() {
    const interviewId =
      answer?.interview_id ??
      answer?.interviewId ??
      answer?.interview?.id ??
      sessionStorage.getItem(
        "currentInterviewId"
      );

    if (interviewId) {
      navigate("/interview/results", {
        state: {
          interviewId,
        },
      });
      return;
    }

    navigate("/interview/history");
  }

  if (loading) {
    return (
      <main className="mobile-page loading-page">
        <div className="loading-spinner" />

        <h2>
          Loading your answer...
        </h2>

        <p>
          We're preparing the detailed
          feedback.
        </p>
      </main>
    );
  }

  if (error || !answer) {
    return (
      <main className="mobile-page">
        <button
          type="button"
          className="back-btn"
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">
            ANSWER REVIEW
          </div>

          <h1>
            Answer unavailable
          </h1>

          <p>
            {error ||
              "We couldn't find this answer."}
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={handleResults}
        >
          Back to Results
        </button>
      </main>
    );
  }

  const score = getScore(answer);
  const question = getQuestion(answer);
  const answerText = getAnswerText(answer);
  const feedback = getFeedback(answer);
  const strengths = getStrengths(answer);
  const improvements = getImprovements(answer);
  const recommendations = getRecommendations(answer);
  const speechMetrics = getSpeechMetrics(answer);
  const evaluationScores = getEvaluationScores(answer);
  const videoUrl = getVideoUrl(answer);

  return (
    <main className="mobile-page answer-detail-page">
      {/* Header */}
      <header className="answer-detail-header">
        <button
          type="button"
          className="back-btn"
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className="eyebrow">
          ANSWER REVIEW
        </div>

        <h1>
          Detailed feedback
        </h1>
      </header>

      {/* Score */}
      <section className="answer-score-card">
        <div className="answer-score-ring">
          <div>
            <strong>
              {score !== null
                ? score
                : "—"}
            </strong>

            {score !== null && (
              <span>/100</span>
            )}
          </div>
        </div>

        <div>
          <span className="eyebrow">
            PERFORMANCE
          </span>

          <h2>
            {getScoreLabel(score)}
          </h2>

          {score !== null && (
            <div
              className={`answer-score-status ${getScoreClass(
                score
              )}`}
            >
              {score >= 70
                ? "Strong response"
                : "Opportunity to improve"}
            </div>
          )}
        </div>
      </section>

      {/* Question */}
      <section className="answer-detail-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              QUESTION
            </span>

            <h2>
              What were you asked?
            </h2>
          </div>
        </div>

        <div className="question-detail-card">
          <p>
            {question}
          </p>
        </div>
      </section>

      {/* Video */}
      {videoUrl && (
        <section className="answer-detail-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                RECORDING
              </span>

              <h2>
                Your response
              </h2>
            </div>
          </div>

          <div className="answer-video-card">
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
            />
          </div>
        </section>
      )}

      {/* Transcript */}
      {answerText && (
        <section className="answer-detail-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                TRANSCRIPT
              </span>

              <h2>
                What you said
              </h2>
            </div>
          </div>

          <div className="transcript-card">
            <p>
              {answerText}
            </p>
          </div>
        </section>
      )}

      {/* AI Feedback */}
      <section className="answer-detail-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              AI FEEDBACK
            </span>

            <h2>
              How you performed
            </h2>
          </div>
        </div>

        <div className="answer-feedback-card">
          <div className="feedback-card-icon">
            ✦
          </div>

          <p>
            {feedback ||
              "No detailed feedback is available for this answer yet."}
          </p>
        </div>
      </section>

      {Object.keys(evaluationScores).length > 0 && (
        <section className="answer-detail-section answer-evaluation-section">
          <div className="section-heading"><div><span className="eyebrow">EVALUATION</span><h2>Performance scores</h2></div></div>
          <div className="answer-evaluation-grid">{Object.entries(evaluationScores).map(([name, value]) => <div className="answer-evaluation-item" key={name}><span>{name.replace(/([A-Z])/g, " $1")}</span><strong>{value}/100</strong><div><i style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%` }} /></div></div>)}</div>
        </section>
      )}

      {Object.keys(speechMetrics).length > 0 && (
        <section className="answer-detail-section">
          <div className="section-heading"><div><span className="eyebrow">SPEECH METRICS</span><h2>Speaking performance</h2></div></div>
          <div className="answer-metrics-grid">{Object.entries(speechMetrics).map(([name, value]) => <div key={name}><span>{name.replace(/([A-Z])/g, " $1")}</span><strong>{value}</strong></div>)}</div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="answer-detail-section">
          <div className="section-heading"><div><span className="eyebrow">RECOMMENDATIONS</span><h2>How to improve</h2></div></div>
          <div className="answer-recommendations">{recommendations.map((item, index) => <p key={index}><b>{index + 1}</b>{typeof item === "string" ? item : item?.text || item?.description || item?.title || "Practice this area."}</p>)}</div>
        </section>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <section className="answer-detail-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                WHAT WENT WELL
              </span>

              <h2>
                Strengths
              </h2>
            </div>
          </div>

          <div className="answer-feedback-list">
            {strengths.map(
              (item, index) => (
                <div
                  className="answer-feedback-item positive"
                  key={index}
                >
                  <span className="feedback-item-icon">
                    ✓
                  </span>

                  <p>
                    {typeof item === "string"
                      ? item
                      : item?.text ||
                        item?.description ||
                        item?.title ||
                        "Strong point in your response."}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <section className="answer-detail-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                NEXT TIME
              </span>

              <h2>
                Areas to improve
              </h2>
            </div>
          </div>

          <div className="answer-feedback-list">
            {improvements.map(
              (item, index) => (
                <div
                  className="answer-feedback-item improvement"
                  key={index}
                >
                  <span className="feedback-item-icon">
                    !
                  </span>

                  <p>
                    {typeof item === "string"
                      ? item
                      : item?.text ||
                        item?.description ||
                        item?.title ||
                        "Consider improving this part of your response."}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Bottom actions */}
      <section className="answer-detail-actions">
        <button
          type="button"
          className="primary-btn"
          onClick={handleResults}
        >
          Back to Results
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={() =>
            navigate(
              "/interview/setup"
            )
          }
        >
          Practice Again
          <span>→</span>
        </button>
      </section>
    </main>
  );
}
