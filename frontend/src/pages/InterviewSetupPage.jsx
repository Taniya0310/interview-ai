import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from "../services/authApi";
import { getProfile } from "../services/profileApi";

import {
  Clock3,
  CircleHelp,
  Code2,
  MessageCircle,
  Shuffle,
  Video
} from "lucide-react";

import BottomNav from "../components/BottomNav";

async function api(path, options = {}) {
  return authenticatedFetch(path, options);
}

export default function InterviewSetupPage() {
  const navigate = useNavigate();

  const [interviewType, setInterviewType] =
    useState("technical");

  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] =
    useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();
        setDomain(profile.domain || "");
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load your profile."
        );
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleStart(event) {
    event.preventDefault();

    if (loading || profileLoading) {
      return;
    }

    setError("");

    if (interviewType === "technical" && !domain) {
      setError(
        "Domain is not set in your profile. Please select a domain first."
      );
      return;
    }

    try {
      setLoading(true);

      sessionStorage.removeItem("currentInterview");
      sessionStorage.removeItem("currentInterviewId");
      sessionStorage.removeItem("currentReport");

      const interview = await api("/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          interviewType,
          domain:
            interviewType === "technical"
              ? domain
              : null
        })
      });

      const interviewId =
        interview?.id ??
        interview?.interview_id ??
        interview?.interviewId;

      if (!interviewId) {
        throw new Error(
          "Interview was created but no interview ID was returned."
        );
      }

      sessionStorage.setItem(
        "currentInterview",
        JSON.stringify(interview)
      );

      sessionStorage.setItem(
        "currentInterviewId",
        String(interviewId)
      );

      navigate("/interview/device-check");
    } catch (requestError) {
      console.error(
        "Create interview error:",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to create the interview."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectInterviewType(type) {
    setInterviewType(type);
    setError("");
  }

  function optionClass(type) {
    return interviewType === type
      ? "setup-option active"
      : "setup-option";
  }

  const formattedDomain = domain
    ? domain.replaceAll("_", " ")
    : "";

  return (
    <main className="mobile-page interview-setup-page">
      <header className="setup-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">SkillzageAI</div>

          <h1>Set up your interview</h1>

          <p>
            Choose a category for your interview.
          </p>
        </div>
      </header>

      <section
        className="setup-meta-card"
        aria-label="Interview details"
      >
        <div className="setup-meta-item">
          <span className="setup-meta-icon">
            <Clock3 size={22} strokeWidth={1.8} />
          </span>

          <small>DURATION</small>
          <strong>15 min</strong>
        </div>

        <div className="setup-meta-item">
          <span className="setup-meta-icon">
            <CircleHelp size={22} strokeWidth={1.8} />
          </span>

          <small>QUESTIONS</small>
          <strong>All Active</strong>
        </div>

        <div className="setup-meta-item">
          <span className="setup-meta-icon">
            <Video size={22} strokeWidth={1.8} />
          </span>

          <small>TYPE</small>
          <strong>Voice & Video</strong>
        </div>
      </section>

      <form
        className="setup-form"
        onSubmit={handleStart}
      >
        <section className="setup-section">
          <div className="section-heading">
            <span className="eyebrow">STEP 01</span>

            <h2>Interview category</h2>

            <p>
              Select the type of interview you want to
              practice.
            </p>
          </div>

          <div className="setup-option-grid">
            <button
              type="button"
              className={optionClass("technical")}
              onClick={() =>
                selectInterviewType("technical")
              }
              disabled={profileLoading}
            >
              <span className="setup-option-icon">
                <Code2 size={28} />
              </span>

              <span className="setup-option-content">
                <strong>Domain specific</strong>

                <small>
                  Questions based on your selected
                  Domain.
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType === "technical"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={optionClass("non-technical")}
              onClick={() =>
                selectInterviewType("non-technical")
              }
            >
              <span className="setup-option-icon">
                <MessageCircle size={28} />
              </span>

              <span className="setup-option-content">
                <strong>Non-Technical</strong>

                <small>
                  Introduction, communication,
                  teamwork, and workplace situations.
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType === "non-technical"
                  ? "✓"
                  : ""}
              </span>
            </button>

            <button
              type="button"
              className={optionClass("mixed")}
              onClick={() =>
                selectInterviewType("mixed")
              }
            >
              <span className="setup-option-icon">
                <Shuffle size={28} />
              </span>

              <span className="setup-option-content">
                <strong>Mixed</strong>

                <small>
                  Combination of technical and
                  non-technical questions.
                </small>
              </span>

              <span className="setup-option-check">
                {interviewType === "mixed"
                  ? "✓"
                  : ""}
              </span>
            </button>
          </div>
        </section>

        {interviewType === "technical" &&
          !profileLoading &&
          !domain && (
            <div className="form-error">
              <span>!</span>

              <p>
                Domain is not set in your
                profile. Please select a domain before
                starting a technical interview.
              </p>
            </div>
          )}

        {interviewType === "technical" &&
          !profileLoading &&
          !domain && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/profile")}
            >
              Set Domain in Profile
            </button>
          )}

        {interviewType === "technical" &&
          domain && (
            <p className="field-hint">
              Domain selected:{" "}
              <strong>{formattedDomain}</strong>
            </p>
          )}

        {error && (
          <div className="form-error">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        <section className="setup-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={loading || profileLoading}
          >
            {profileLoading
              ? "Loading Profile..."
              : loading
              ? "Creating Interview..."
              : "Start Interview"}

            <span>→</span>
          </button>

          <p>
            You will check your camera and microphone
            before the interview begins.
          </p>
        </section>
      </form>

      <BottomNav />
    </main>
  );
}
