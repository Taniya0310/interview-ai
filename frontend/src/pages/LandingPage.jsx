import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  LockKeyhole,
  MessageCircle,
  Mic
} from "lucide-react";

const features = [
  [
    BrainCircuit,
    "Adaptive questions",
    "Questions built around your role and skill level."
  ],
  [
    MessageCircle,
    "Real-time feedback",
    "Get instant, personalized feedback on every answer."
  ],
  [
    LockKeyhole,
    "Smart & secure",
    "Your practice data is private and completely secure."
  ]
];

export default function LandingPage() {
  const navigate = useNavigate();

  function handleGetStarted() {
    localStorage.setItem(
      "hasSeenLanding",
      "true"
    );

    navigate("/dashboard");
  }

  return (
    <main className="landing-page landing-reference">
      <div
        className="landing-hero-art"
        aria-hidden="true"
      />

      <div className="landing-mic">
        <Mic size={46} strokeWidth={2.5} />
      </div>

      <section className="landing-content">
        <h1>
          Interview<span>AI</span>
        </h1>

        <p className="landing-copy">
          Practice smarter.
          <br />
          Improve faster.
          <br />
          Succeed with confidence.
        </p>

        <div className="landing-rule" />
      </section>

      <section className="landing-features">
        {features.map(
          ([Icon, title, text]) => (
            <article key={title}>
              <span className="feature-icon">
                <Icon
                  size={48}
                  strokeWidth={2}
                />
              </span>

              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>

              <ArrowRight
                className="feature-arrow"
                size={35}
              />
            </article>
          )
        )}
      </section>

      <button
        type="button"
        className="landing-btn"
        onClick={handleGetStarted}
      >
        Get started
        <ArrowRight size={40} />
      </button>

      <p className="landing-footer">
        <LockKeyhole size={23} />
        AI-powered interview practice
      </p>
    </main>
  );
}