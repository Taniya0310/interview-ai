import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Share2, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
const [showLogoutModal, setShowLogoutModal] =
  useState(false);
  const [appMessage, setAppMessage] = useState("");
  function handleClearSession() {
    sessionStorage.removeItem("currentInterview");
    sessionStorage.removeItem("currentInterviewId");
    sessionStorage.removeItem("currentReport");

   setAppMessage("Current interview session cleared.");

setTimeout(() => {
  setAppMessage("");
}, 2500);
  }

 function handleLogout() {
  setShowLogoutModal(true);
}

function confirmLogout() {
  logout();
  setShowLogoutModal(false);

  navigate("/login", {
    replace: true
  });
}
function handleShareApp() {
  if (window.AndroidTTS?.shareApp) {
    window.AndroidTTS.shareApp();
  } else {
   setAppMessage(
  "App sharing is available in the Android app."
);

setTimeout(() => {
  setAppMessage("");
}, 2500);
  }
}
  return (
    <main className="mobile-page settings-page">
      {/* Header */}
      <header className="settings-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">
            SKILLZAGE AI
          </div>

          <h1>Settings</h1>

          <p>
            Manage your interview experience
            and application preferences.
          </p>
        </div>
      </header>

      {/* Interview */}
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              INTERVIEW
            </span>

            <h2>Interview experience</h2>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-icon">
              ✦
            </div>

            <div className="settings-content">
              <h3>Interview Setup</h3>

              <p>
                Configure your role, difficulty
                and number of questions before
                each interview.
              </p>
            </div>

            <button
              type="button"
              className="settings-action"
              onClick={() =>
                navigate("/interview/setup")
              }
            >
              →
            </button>
          </div>

          <div className="settings-divider" />

          <div className="settings-item">
            <div className="settings-icon">
              ◷
            </div>

            <div className="settings-content">
              <h3>Interview History</h3>

              <p>
                Review previous interviews,
                scores and feedback.
              </p>
            </div>

            <button
              type="button"
              className="settings-action"
              onClick={() =>
                navigate(
                  "/interview/history"
                )
              }
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* Devices */}
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              DEVICES
            </span>

            <h2>Camera & microphone</h2>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-icon">
              ◉
            </div>

            <div className="settings-content">
              <h3>Camera</h3>

              <p>
                Camera access is requested when
                you start an interview.
              </p>
            </div>

            <span className="settings-status">
              Automatic
            </span>
          </div>

          <div className="settings-divider" />

          <div className="settings-item">
            <div className="settings-icon">
              ◌
            </div>

            <div className="settings-content">
              <h3>Microphone</h3>

              <p>
                Your microphone is used to
                record your interview answers.
              </p>
            </div>

            <span className="settings-status">
              Automatic
            </span>
          </div>
        </div>
      </section>

      {/* Voice */}
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              VOICE
            </span>

            <h2>AI interviewer voice</h2>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-icon">
              ♪
            </div>

            <div className="settings-content">
              <h3>Voice Questions</h3>

              <p>
                Interview questions are spoken
                using your device's available
                speech capabilities.
              </p>
            </div>

            <span className="settings-status active">
              Enabled
            </span>
          </div>
        </div>
      </section>
{/* Share App */}
<section className="settings-section">
  <div className="section-heading">
    <div>
      <span className="eyebrow">
        SHARE
      </span>

      <h2>Share Skillzage AI</h2>
    </div>
  </div>

  <div className="settings-card">
    <div className="settings-item">
      <div className="settings-icon">
        <Share2 size={20} />
      </div>

      <div className="settings-content">
        <h3>Share the app</h3>

        <p>
          Send the Skillzage AI APK to someone
          through WhatsApp or another app.
        </p>
      </div>

      <button
        type="button"
        className="settings-action"
        onClick={handleShareApp}
        aria-label="Share app"
      >
        →
      </button>
    </div>
  </div>
</section>
      {/* Session */}
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              SESSION
            </span>

            <h2>Application data</h2>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-icon">
              ⟳
            </div>

            <div className="settings-content">
              <h3>Clear Current Session</h3>

              <p>
                Remove temporary interview data
                stored on this device.
              </p>
            </div>

            <button
              type="button"
              className="settings-danger-action"
              onClick={
                handleClearSession
              }
            >
              <X size={18} strokeWidth={2.5} aria-label="Clear session" />
            </button>
          </div>
        </div>
      </section>
{/* Logout */}
<section className="settings-section">
  <div className="settings-card">
    <div className="settings-item">
      <div className="settings-icon">
        <LogOut size={20} />
      </div>

      <div className="settings-content">
        <h3>Log out</h3>

        <p>
          Sign out of your Skillzage AI account
          on this device.
        </p>
      </div>

      <button
        type="button"
        className="settings-danger-action"
        onClick={handleLogout}
        aria-label="Log out"
      >
        <LogOut size={18} />
      </button>
    </div>
  </div>
</section>
      {/* About */}
      <section className="settings-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              ABOUT
            </span>

            <h2>Skillzage AI</h2>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-item">
            <div className="settings-icon">
              ✦
            </div>

            <div className="settings-content">
              <h3>AI Interview Platform</h3>

              <p>
                Practice realistic interviews,
                receive AI-powered feedback and
                improve your communication.
              </p>
            </div>

            <span className="settings-version">
              v1.0
            </span>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="settings-bottom">
        <button
          type="button"
          className="secondary-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Back to Dashboard
        </button>
      </section>

      {/* Bottom Navigation */}
      

      {appMessage && (
  <div className="app-toast" role="status">
    <span>✓</span>

    <p>{appMessage}</p>

    <button
      type="button"
      onClick={() => setAppMessage("")}
      aria-label="Close message"
    >
      ×
    </button>
  </div>
)}
      {showLogoutModal && (
  <div className="logout-modal-overlay">
    <div className="logout-modal">
      <div className="logout-modal-icon">
        <LogOut size={24} />
      </div>

      <h2>Log out?</h2>

      <p>
        Are you sure you want to log out?
      </p>

      <div className="logout-modal-actions">
        <button
          type="button"
          className="logout-cancel-btn"
          onClick={() =>
            setShowLogoutModal(false)
          }
        >
          Cancel
        </button>

        <button
          type="button"
          className="logout-confirm-btn"
          onClick={confirmLogout}
        >
          Log out
        </button>
      </div>
    </div>
  </div>
)}
<BottomNav />
    </main>
    
  );
}
