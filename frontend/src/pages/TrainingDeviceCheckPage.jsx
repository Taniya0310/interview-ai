import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mic, MicOff, RefreshCw } from "lucide-react";

import "../styles/training.css";

export default function TrainingDeviceCheckPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = location.state?.session;
  const questions = location.state?.questions || [];

  const streamRef = useRef(null);

  const [micStatus, setMicStatus] = useState("checking");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const stopMicrophone = useCallback(() => {
    if (!streamRef.current) {
      return;
    }

    streamRef.current.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
  }, []);

  const checkMicrophone = useCallback(async () => {
    setChecking(true);
    setError("");
    setMicStatus("checking");

    stopMicrophone();

    try {
      if (!session || !questions.length) {
        navigate("/training/setup", {
          replace: true
        });

        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Microphone access is not supported on this device."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });

      streamRef.current = stream;

      const audioTracks = stream.getAudioTracks();

      setMicStatus(
        audioTracks.length > 0
          ? "ready"
          : "unavailable"
      );
    } catch (microphoneError) {
      console.error(
        "[TRAINING DEVICE CHECK]",
        microphoneError
      );

      setMicStatus("unavailable");

      setError(
        microphoneError?.message ||
          "Unable to access your microphone."
      );
    } finally {
      setChecking(false);
    }
  }, [navigate, questions.length, session, stopMicrophone]);

  useEffect(() => {
    checkMicrophone();

    return () => {
      stopMicrophone();
    };
  }, [checkMicrophone, stopMicrophone]);

  function handleContinue() {
    if (micStatus !== "ready") {
      setError(
        "Microphone access is required to continue."
      );

      return;
    }

    stopMicrophone();

    navigate("/training", {
      state: {
        session,
        questions
      }
    });
  }

  function handleBack() {
    stopMicrophone();
    navigate("/training/setup");
  }

  return (
    <main className="training-page">
      <section className="training-card training-device-card">
        <button
          type="button"
          className="training-back"
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className="training-device-header">
          <p className="eyebrow">BEFORE WE START</p>

          <h1>Check your microphone</h1>

          <p>
            We need microphone access to record your
            voice answers during training.
          </p>
        </div>

        <div
          className={
            micStatus === "ready"
              ? "training-device-icon ready"
              : micStatus === "unavailable"
                ? "training-device-icon error"
                : "training-device-icon checking"
          }
        >
          {micStatus === "unavailable" ? (
            <MicOff size={42} />
          ) : (
            <Mic size={42} />
          )}
        </div>

        <div className="training-device-status">
          <span
            className={
              micStatus === "ready"
                ? "status-dot ready"
                : micStatus === "unavailable"
                  ? "status-dot error"
                  : "status-dot checking"
            }
          />

          <strong>
            {checking
              ? "Checking microphone..."
              : micStatus === "ready"
                ? "Microphone ready"
                : "Microphone unavailable"}
          </strong>
        </div>

        <p className="training-device-help">
          Allow microphone permission when your device
          asks for it. Your audio will be used only for
          evaluating your training answer.
        </p>

        {error && (
          <p className="training-error">
            {error}
          </p>
        )}

        <button
          type="button"
          className="training-submit-button"
          disabled={
            checking || micStatus !== "ready"
          }
          onClick={handleContinue}
        >
          Continue to Training
        </button>

        <button
          type="button"
          className="training-skip-button training-check-again"
          disabled={checking}
          onClick={checkMicrophone}
        >
          <RefreshCw size={16} />
          Check Again
        </button>
      </section>
    </main>
  );
}