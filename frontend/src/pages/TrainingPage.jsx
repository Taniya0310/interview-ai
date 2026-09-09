import { useEffect, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Mic,
  MicOff,
} from "lucide-react";

import { createTtsChunker } from "../services/ttsChunker";
import "../styles/training.css";

import {
  submitTrainingAnswer,
  completeTrainingSession,
} from "../services/trainingApi";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remainingSeconds = (seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export default function TrainingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = location.state?.session;
  const questions = location.state?.questions || [];

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const ttsTimerRef = useRef(null);
const ttsRunIdRef = useRef(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const recordingStartedAtRef = useRef(null);
  const hasSpeechRef = useRef(false);
  const mountedRef = useRef(true);

  const ttsChunkerRef = useRef(null);
  const ttsChunkIdRef = useRef(0);

  const questionIndexRef = useRef(0);
  const currentQuestionRef = useRef(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [displayQuestion, setDisplayQuestion] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const question = questions[questionIndex];

  const questionText =
    displayQuestion ||
    question?.text ||
    "No question available.";

  const SILENCE_LIMIT = 3000;
  const MIN_RECORDING_TIME = 1500;
  const SILENCE_THRESHOLD = 0.015;

  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  useEffect(() => {
    currentQuestionRef.current = question || null;
  }, [question]);

  function clearSilenceMonitoring() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

function clearTtsTimer() {
  if (ttsTimerRef.current) {
    clearTimeout(ttsTimerRef.current);
    ttsTimerRef.current = null;
  }

  ttsChunkerRef.current?.reset?.();
  ttsChunkerRef.current = null;
  ttsChunkIdRef.current = 0;
}

  function stopAudioResources() {
    clearSilenceMonitoring();

    audioContextRef.current?.close?.();
    audioContextRef.current = null;
    analyserRef.current = null;
  }

 function monitorSilence() {
  const analyser = analyserRef.current;
  const recorder = recorderRef.current;

  if (
    !analyser ||
    !recorder ||
    recorder.state !== "recording"
  ) {
    return;
  }

  const buffer = new Uint8Array(
    analyser.fftSize
  );

  analyser.getByteTimeDomainData(buffer);

  let sum = 0;

  for (const value of buffer) {
    const normalized = (value - 128) / 128;
    sum += normalized * normalized;
  }

  const volume = Math.sqrt(
    sum / buffer.length
  );

  const recordingTime =
    Date.now() -
    recordingStartedAtRef.current;

  const isSilent =
    recordingTime > MIN_RECORDING_TIME &&
    volume < SILENCE_THRESHOLD;

  if (isSilent) {
    if (!silenceTimerRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) {
          return;
        }

        setMessage(
          "I detected silence. Submitting your answer..."
        );

        stopRecording();
      }, SILENCE_LIMIT);
    }
  } else if (silenceTimerRef.current) {
    clearTimeout(
      silenceTimerRef.current
    );

    silenceTimerRef.current = null;
  }

  animationFrameRef.current =
    requestAnimationFrame(
      monitorSilence
    );
}
function speakQuestion() {
  if (!mountedRef.current) {
    return;
  }

  clearTtsTimer();

  setError("");
  setMessage("Here's your question.");

  const nativeTts = window.AndroidTTS;

  if (!nativeTts?.speakChunk) {
    setMessage("I'm listening. Take your time.");
    startRecording();
    return;
  }

  try {
    nativeTts.stop?.();
    nativeTts.clearQueue?.();

    ttsChunkerRef.current = createTtsChunker();
    ttsChunkIdRef.current = 0;

    const chunks = ttsChunkerRef.current.addText(
      questionText
    );

    const finalChunk =
      ttsChunkerRef.current.flush();

    if (finalChunk?.trim()) {
      chunks.push(finalChunk);
    }

    const validChunks = chunks.filter(
      (chunk) => chunk && chunk.trim()
    );

    console.log("[TTS] Full question:", questionText);
    console.log("[TTS] Total chunks:", validChunks.length);

    let chunkIndex = 0;

    function speakNextChunk() {
      if (!mountedRef.current) {
        return;
      }

      if (chunkIndex >= validChunks.length) {
        const wordCount = questionText
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;

        const estimatedSpeechTime = Math.max(
          3500,
          wordCount * 650
        );

        console.log(
          "[TTS] All chunks sent. Waiting:",
          estimatedSpeechTime,
          "ms"
        );

        ttsTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) {
            return;
          }

          console.log(
            "[TTS] Finished. Starting recording."
          );

          setMessage(
            "I'm listening. Take your time."
          );

          startRecording();
        }, estimatedSpeechTime);

        return;
      }

      const chunk = validChunks[chunkIndex];

      ttsChunkIdRef.current += 1;

      console.log("[TTS] Speaking chunk:", {
        chunkNumber: chunkIndex + 1,
        totalChunks: validChunks.length,
        text: chunk,
      });

      nativeTts.speakChunk(
        chunk,
        String(ttsChunkIdRef.current)
      );

      chunkIndex += 1;

      // Wait before sending the next chunk.
      ttsTimerRef.current = setTimeout(
        speakNextChunk,
        900
      );
    }

    speakNextChunk();
  } catch (ttsError) {
    console.error(
      "[TRAINING TTS ERROR]",
      ttsError
    );

    setMessage(
      "I'm listening. Take your time."
    );

    startRecording();
  }
}

  useEffect(() => {
    if (
      !questionText ||
      questionText === "No question available."
    ) {
      return;
    }

    const questionTimer = setTimeout(() => {
      speakQuestion();
    }, 300);

    return () => {
      clearTimeout(questionTimer);
      clearTtsTimer();

      window.AndroidTTS?.stop?.();
      window.AndroidTTS?.clearQueue?.();

      ttsChunkerRef.current?.reset?.();
    };
  }, [questionText]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      clearInterval(timerRef.current);
      clearTimeout(feedbackTimerRef.current);
      clearTtsTimer();

      clearSilenceMonitoring();
      stopAudioResources();

      streamRef.current?.getTracks().forEach(
        (track) => track.stop()
      );

      window.AndroidTTS?.stop?.();
      window.AndroidTTS?.clearQueue?.();

      ttsChunkerRef.current?.reset?.();
    };
  }, []);

  async function startRecording() {
    if (!mountedRef.current || submitting) return;

    if (recorderRef.current?.state === "recording") {
      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError(
        "Microphone recording is not supported."
      );
      return;
    }

    try {
      setError("");
      

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (AudioContextClass) {
        const audioContext =
          new AudioContextClass();

        if (audioContext.state === "suspended") {
          await audioContext.resume().catch(() => {});
        }

        const source =
          audioContext.createMediaStreamSource(stream);

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 512;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      }

      const supportedMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/wav",
      ];

      const mimeType =
        supportedMimeTypes.find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) || "";

     const recorder = mimeType
  ? new MediaRecorder(stream, {
      mimeType,
      audioBitsPerSecond: 32000,
    })
  : new MediaRecorder(stream);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "[TRAINING RECORDER ERROR]",
          event
        );

        clearInterval(timerRef.current);
        stopAudioResources();

        stream.getTracks().forEach(
          (track) => track.stop()
        );

        recorderRef.current = null;
        streamRef.current = null;

        setRecording(false);
        setError(
          "Recording failed. Please try again."
        );
        setMessage("");
      };

      recorder.onstop = async () => {
        clearInterval(timerRef.current);
        clearSilenceMonitoring();

        const duration =
          Math.max(
            1,
            Math.round(
              (Date.now() -
                recordingStartedAtRef.current) /
                1000
            )
          );

        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: recorder.mimeType || "audio/webm",
          }
        );

        stream.getTracks().forEach(
          (track) => track.stop()
        );

        streamRef.current = null;
        recorderRef.current = null;

        stopAudioResources();

        setRecording(false);
        setRecordedAudio(audioBlob);

        if (!audioBlob.size) {
          setError(
            "No voice was recorded. Please try again."
          );
          setMessage("");
          return;
        }

        setMessage(
          "Your answer was recorded. Analyzing now..."
        );

        await submitAnswer(audioBlob, duration);

        hasSpeechRef.current = false;
      };

      recorder.start();

      recordingStartedAtRef.current = Date.now();
      hasSpeechRef.current = false;

      setRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(
          (seconds) => seconds + 1
        );
      }, 1000);

      monitorSilence();
    } catch (recordingError) {
      console.error(
        "[TRAINING MICROPHONE ERROR]",
        recordingError
      );

      setError(
        "Microphone permission is required."
      );
      setMessage("");
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    clearSilenceMonitoring();

    const recorder = recorderRef.current;

    if (
      recorder &&
      recorder.state === "recording"
    ) {
      recorder.stop();
    }
  }

  async function submitAnswer(
    audioToSubmit,
    duration
  ) {
    if (!audioToSubmit) {
      setError("Please record an answer first.");
      return;
    }

    if (!session?.id || !question?.id) {
      setError(
        "Training session or question is missing."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("Analyzing your answer...");

      const formData = new FormData();

      formData.append(
        "audio",
        audioToSubmit,
        "training-answer.webm"
      );

      formData.append(
        "questionId",
        String(question.id)
      );

      formData.append(
        "questionText",
        questionText
      );

      formData.append(
        "durationSeconds",
        String(duration)
      );

      const result =
        await submitTrainingAnswer(
          session.id,
          formData
        );

      const analysis = result?.analysis;

      setMessage(
        analysis?.questionFeedback ||
          "Answer analyzed successfully."
      );

      feedbackTimerRef.current = setTimeout(
        async () => {
          if (
            analysis?.needsFollowUp &&
            analysis?.followUpQuestion
          ) {
            setDisplayQuestion(
              analysis.followUpQuestion
            );

            setRecordedAudio(null);
            setRecordingSeconds(0);
            setMessage(
              "Here is a follow-up question..."
            );

            return;
          }

          if (
            questionIndexRef.current ===
            questions.length - 1
          ) {
            setMessage(
              "Training complete. Great work!"
            );

            await completeTrainingSession(
              session.id
            );

            navigate("/dashboard", {
              replace: true,
            });

            return;
          }

          const nextIndex =
            questionIndexRef.current + 1;

          setQuestionIndex(nextIndex);
          setDisplayQuestion("");
          setRecordedAudio(null);
          setRecordingSeconds(0);
          setMessage(
            "Great. Preparing the next question..."
          );
        },
        1500
      );
    } catch (requestError) {
      console.error(
        "[TRAINING SUBMIT ERROR]",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to analyze your answer."
      );

      setMessage("");
    } finally {
      setSubmitting(false);
    }
  }

  

  if (!session || questions.length === 0) {
    return (
      <main className="training-page">
        <section className="training-card">
          <h1>Training unavailable</h1>

          <p>
            Please start a new training session.
          </p>

          <button
            type="button"
            className="training-start-button"
            onClick={() =>
              navigate("/training/setup")
            }
          >
            Back to Training Setup
          </button>
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
          onClick={() =>
            navigate("/training/setup")
          }
        >
          ← Back
        </button>

        <div className="training-heading-row">
          <div>
            <p className="eyebrow">
              VOICE PRACTICE
            </p>

            <h1>Voice Training</h1>
          </div>

          <span className="training-progress">
            {questionIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="training-progress-bar">
          <span
            style={{
              width: `${
                ((questionIndex + 1) /
                  questions.length) *
                100
              }%`,
            }}
          />
        </div>

        <section className="training-question-card">
          <p className="training-label">
            TRAINING QUESTION
          </p>

          <h2>{questionText}</h2>

          <p>
            The question will be spoken aloud. Answer
            naturally using your voice.
          </p>
        </section>

        <section className="training-record-card">
          <div
            className={
              recording
                ? "training-mic recording"
                : "training-mic"
            }
          >
            {recording ? (
              <MicOff size={34} />
            ) : (
              <Mic size={34} />
            )}
          </div>

          <h3>
            {recording
              ? "Listening..."
              : submitting
              ? "Analyzing your answer..."
              : "Preparing your question..."}
          </h3>

          <p>
            {recording
              ? "Speak clearly. Your answer will submit automatically after 3 seconds of silence."
              : submitting
              ? "Please wait while we review your response."
              : "Please listen carefully. Recording will start automatically."}
          </p>

          <div className="training-timer">
            {formatTime(recordingSeconds)}
          </div>

          
        </section>

        {error && (
          <p className="training-error">
            {error}
          </p>
        )}

        {message && (
          <p className="training-success">
            {message}
          </p>
        )}

        
      </section>
    </main>
  );
}