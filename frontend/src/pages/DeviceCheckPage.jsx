import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DeviceCheckPage() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraStatus, setCameraStatus] =
    useState("checking");

  const [micStatus, setMicStatus] =
    useState("checking");

  const [error, setError] =
    useState("");

  const [starting, setStarting] =
    useState(true);

  const [interview, setInterview] =
    useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const checkDevices = useCallback(
    async () => {
      setStarting(true);
      setError("");

      setCameraStatus("checking");
      setMicStatus("checking");

      stopStream();

      try {
        const currentInterview =
          sessionStorage.getItem(
            "currentInterview"
          );

        if (!currentInterview) {
          navigate(
            "/interview/setup",
            { replace: true }
          );

          return;
        }

        const parsedInterview =
          JSON.parse(
            currentInterview
          );

        setInterview(
          parsedInterview
        );

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Camera and microphone access are not supported by this browser."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",
                width: {
                  ideal: 640,
                },
                height: {
                  ideal: 360,
                },
              },
              audio: true,
            }
          );

        streamRef.current =
          stream;

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play().catch(
            () => {}
          );
        }

        const videoTracks =
          stream.getVideoTracks();

        const audioTracks =
          stream.getAudioTracks();

        setCameraStatus(
          videoTracks.length > 0
            ? "ready"
            : "unavailable"
        );

        setMicStatus(
          audioTracks.length > 0
            ? "ready"
            : "unavailable"
        );
      } catch (err) {
        console.error(
          "Device check error:",
          err
        );

        setCameraStatus(
          "unavailable"
        );

        setMicStatus(
          "unavailable"
        );

        setError(
          err?.message ||
            "Unable to access your camera and microphone."
        );
      } finally {
        setStarting(false);
      }
    },
    [navigate, stopStream]
  );

  useEffect(() => {
    const currentInterview =
      sessionStorage.getItem(
        "currentInterview"
      );

    if (!currentInterview) {
      navigate(
        "/interview/setup",
        { replace: true }
      );

      return;
    }

    checkDevices();

    return () => {
      stopStream();
    };
  }, [
    navigate,
    checkDevices,
    stopStream,
  ]);

  function handleContinue() {
    if (
      cameraStatus !== "ready"
    ) {
      setError(
        "Camera access is required to continue."
      );

      return;
    }

    stopStream();

    navigate(
      "/interview/live"
    );
  }

  function handleBack() {
    stopStream();

    navigate(
      "/interview/setup"
    );
  }

  function getStatusLabel(
    status
  ) {
    if (status === "ready") {
      return "Ready";
    }

    if (
      status === "unavailable"
    ) {
      return "Unavailable";
    }

    return "Checking...";
  }

  return (
    <main className="mobile-page device-check-page">
      {/* Header */}
      <header className="device-check-header">
        <button
          type="button"
          className="back-btn"
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className="page-header">
          <div className="eyebrow">
            BEFORE WE START
          </div>

          <h1>
            Check your setup
          </h1>

          <p>
            Make sure your camera and
            microphone are working before
            starting the interview.
          </p>
        </div>
      </header>

      {/* Camera Preview */}
      <section className="device-preview-section">
        <div className="device-preview">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
          />

          {cameraStatus !==
            "ready" && (
            <div className="device-preview-overlay">
              {starting ? (
                <>
                  <div className="loading-spinner small" />

                  <span>
                    Starting camera...
                  </span>
                </>
              ) : (
                <>
                  <div className="device-camera-icon">
                    ◉
                  </div>

                  <span>
                    Camera preview
                    unavailable
                  </span>
                </>
              )}
            </div>
          )}

          {cameraStatus ===
            "ready" && (
            <div className="camera-ready-badge">
              <span />
              Camera ready
            </div>
          )}
        </div>
      </section>

      {/* Device Status */}
      <section className="device-status-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              DEVICE CHECK
            </span>

            <h2>
              Your equipment
            </h2>
          </div>
        </div>

        <div className="device-status-card">
          {/* Camera */}
          <div className="device-status-item">
            <div className="device-status-icon">
              ◉
            </div>

            <div className="device-status-content">
              <h3>
                Camera
              </h3>

              <p>
                Used for your interview
                recording.
              </p>
            </div>

            <span
              className={
                `device-status-badge ` +
                (cameraStatus ===
                "ready"
                  ? "ready"
                  : cameraStatus ===
                      "unavailable"
                    ? "error"
                    : "")
              }
            >
              <span />

              {getStatusLabel(
                cameraStatus
              )}
            </span>
          </div>

          <div className="settings-divider" />

          {/* Microphone */}
          <div className="device-status-item">
            <div className="device-status-icon">
              ◌
            </div>

            <div className="device-status-content">
              <h3>
                Microphone
              </h3>

              <p>
                Used to capture your
                answers.
              </p>
            </div>

            <span
              className={
                `device-status-badge ` +
                (micStatus ===
                "ready"
                  ? "ready"
                  : micStatus ===
                      "unavailable"
                    ? "error"
                    : "")
              }
            >
              <span />

              {getStatusLabel(
                micStatus
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Interview Info */}
      {interview && (
        <section className="device-interview-info">
          <div>
            <span className="eyebrow">
              YOUR INTERVIEW
            </span>

            <h2>
              {String(
                interview.role ||
                  "Interview"
              )
                .replace(
                  /[-_]/g,
                  " "
                )
                .replace(
                  /\b\w/g,
                  (letter) =>
                    letter.toUpperCase()
                )}
            </h2>
          </div>

          <div className="device-interview-meta">
            <span>
              {interview.questionCount ||
                interview.question_count ||
                interview.questions
                  ?.length ||
                0}{" "}
              questions
            </span>

            <span>
              {String(
                interview.difficulty ||
                  "Beginner"
              )
                .replace(
                  /[-_]/g,
                  " "
                )
                .replace(
                  /\b\w/g,
                  (letter) =>
                    letter.toUpperCase()
                )}
            </span>
          </div>
        </section>
      )}

      {/* Warning */}
      {micStatus ===
        "unavailable" &&
        cameraStatus ===
          "ready" && (
          <div className="device-warning">
            <span>!</span>

            <p>
              Your microphone isn't available.
              You can continue, but you'll need
              to submit your answers manually.
            </p>
          </div>
        )}

      {/* Error */}
      {error && (
        <div className="device-error">
          <span>!</span>

          <p>
            {error}
          </p>
        </div>
      )}

      {/* Actions */}
      <section className="device-actions">
        <button
          type="button"
          className="primary-btn"
          disabled={
            starting ||
            cameraStatus !== "ready"
          }
          onClick={
            handleContinue
          }
        >
          {starting
            ? "Checking..."
            : "Continue to Interview"}

          <span>→</span>
        </button>

        <button
          type="button"
          className="secondary-btn"
          disabled={starting}
          onClick={
            checkDevices
          }
        >
          Check Again
        </button>
      </section>

      {/* Privacy note */}
      <div className="device-privacy-note">
        <span>▣</span>

        <p>
          Your camera and microphone are only
          used during the interview recording.
        </p>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <span>⌂</span>
          <small>
            Home
          </small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate(
              "/interview/history"
            )
          }
        >
          <span>◷</span>
          <small>
            History
          </small>
        </button>

        <button
          type="button"
          className="bottom-nav-item active"
          onClick={
            handleContinue
          }
        >
          <span className="nav-plus">
            +
          </span>

          <small>
            Practice
          </small>
        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() =>
            navigate("/settings")
          }
        >
          <span>⚙</span>

          <small>
            Settings
          </small>
        </button>
      </nav>
    </main>
  );
}