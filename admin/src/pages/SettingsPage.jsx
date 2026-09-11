import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminUser,
  logoutAdmin,
} from "../services/authService";

import {
  getAdminSettings,
  updateAdminSettings,
} from "../services/adminapi";

const defaultSettings = {
  minimum_passing_score: 60,
  follow_up_question_limit: 2,
  speech_speed: 1,
  speech_pitch: 1,
  speech_volume: 1,
  tts_chunk_size: 180,
  silence_timeout_ms: 3000,
  interview_duration_minutes: 30,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const admin = getAdminUser();

  const [settings, setSettings] =
    useState(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const data = await getAdminSettings();

        setSettings({
          ...defaultSettings,
          ...data,
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateSetting(name, value) {
    setSettings((current) => ({
      ...current,
      [name]: Number(value),
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const updated =
        await updateAdminSettings(settings);

      setSettings({
        ...defaultSettings,
        ...updated,
      });

      setMessage(
        "Settings saved successfully."
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", {
      replace: true,
    });
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>Administration</p>
          <h1>Settings</h1>
          <span>
            Configure training, interview, and voice behavior
          </span>
        </div>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {message && (
        <p className="admin-success">
          {message}
        </p>
      )}

      <div className="admin-card">
        <h2>AI and interview settings</h2>

        {loading ? (
          <p>Loading settings...</p>
        ) : (
          <form
            className="settings-form"
            onSubmit={handleSave}
          >
            <label>
              Minimum passing score
              <input
                type="number"
                min="0"
                max="100"
                value={
                  settings.minimum_passing_score
                }
                onChange={(event) =>
                  updateSetting(
                    "minimum_passing_score",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Follow-up question limit
              <input
                type="number"
                min="0"
                max="10"
                value={
                  settings.follow_up_question_limit
                }
                onChange={(event) =>
                  updateSetting(
                    "follow_up_question_limit",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Speech speed
              <input
                type="number"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speech_speed}
                onChange={(event) =>
                  updateSetting(
                    "speech_speed",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Speech pitch
              <input
                type="number"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.speech_pitch}
                onChange={(event) =>
                  updateSetting(
                    "speech_pitch",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Speech volume
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={settings.speech_volume}
                onChange={(event) =>
                  updateSetting(
                    "speech_volume",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              TTS chunk size
              <input
                type="number"
                min="50"
                max="500"
                value={settings.tts_chunk_size}
                onChange={(event) =>
                  updateSetting(
                    "tts_chunk_size",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Silence timeout in milliseconds
              <input
                type="number"
                min="1000"
                max="30000"
                value={
                  settings.silence_timeout_ms
                }
                onChange={(event) =>
                  updateSetting(
                    "silence_timeout_ms",
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Interview duration in minutes
              <input
                type="number"
                min="1"
                max="180"
                value={
                  settings.interview_duration_minutes
                }
                onChange={(event) =>
                  updateSetting(
                    "interview_duration_minutes",
                    event.target.value
                  )
                }
              />
            </label>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save settings"}
            </button>
          </form>
        )}
      </div>

      <div className="admin-card">
        <h2>Admin profile</h2>

        <p>
          <strong>Email:</strong>{" "}
          {admin?.email || "—"}
        </p>

        <p>
          <strong>Name:</strong>{" "}
          {admin?.name || "Administrator"}
        </p>

        <p>
          <strong>Role:</strong> Administrator
        </p>

        <button
          type="button"
          className="admin-primary-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </section>
  );
}