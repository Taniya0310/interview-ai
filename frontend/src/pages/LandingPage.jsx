import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  function handleGetStarted() {
    navigate("/interview/setup");
  }

  return (
    <main className="mobile-page landing-page">
      <div className="landing-logo">
        <div className="logo-icon">
          🤖
        </div>
      </div>

      <div className="landing-content">
        <div className="eyebrow">
          AI POWERED
        </div>

        <h1>
          Interview
          <span> AI</span>
        </h1>

        <p>
          Practice smarter. Improve faster.
          <br />
          Succeed with confidence.
        </p>

        <div className="landing-features">
          <div>
            <span>✦</span>
            <div>
              <strong>Adaptive Questions</strong>
              <small>
                Questions adapt to your answers.
              </small>
            </div>
          </div>

          <div>
            <span>◉</span>
            <div>
              <strong>Real-time Feedback</strong>
              <small>
                Get personalized interview insights.
              </small>
            </div>
          </div>

          <div>
            <span>✓</span>
            <div>
              <strong>Smart & Secure</strong>
              <small>
                Your interview data stays protected.
              </small>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="primary-btn landing-btn"
        onClick={handleGetStarted}
      >
        Get Started
        <span>→</span>
      </button>

      <p className="landing-footer">
        AI-powered video interview practice
      </p>
    </main>
  );
}