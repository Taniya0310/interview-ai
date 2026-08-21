import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);

  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore invalid error response.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default function LiveInterviewPage() {
  const navigate = useNavigate();

  // -----------------------------
  // Interview
  // -----------------------------
  const [interview, setInterview] = useState(null);

  const [questionIndex, setQuestionIndex] =
    useState(0);

  const [prompt, setPrompt] = useState("");

  const [parentAnswerId, setParentAnswerId] =
    useState(null);

  // -----------------------------
  // UI state
  // -----------------------------
  const [recording, setRecording] =
    useState(false);

  const [canAutoSubmit, setCanAutoSubmit] =
    useState(true);

  const [status, setStatus] = useState(
    "Let me get everything ready for you..."
  );

  const [error, setError] = useState("");

  const [processingAnswer, setProcessingAnswer] =
    useState(false);

  // -----------------------------
  // Media refs
  // -----------------------------
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  // -----------------------------
  // Audio / silence refs
  // -----------------------------
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const recordingStartedAtRef = useRef(null);

  // -----------------------------
  // Speech refs
  // -----------------------------
  const speechRef = useRef(null);
  const voicesRef = useRef([]);

  // -----------------------------
  // Interview refs
  // -----------------------------
  const questionIndexRef = useRef(0);
  const parentAnswerIdRef = useRef(null);
  const currentQuestionRef = useRef(null);

  // Prevent duplicate finish/navigation.
  const interviewFinishedRef = useRef(false);

  // Prevent recording after component unmount.
  const mountedRef = useRef(true);

  // -----------------------------
  // Constants
  // -----------------------------
  const SILENCE_LIMIT = 3000;
  const MIN_RECORDING_TIME = 1500;
  const SILENCE_THRESHOLD = 0.015;

  // ============================================================
  // LOAD INTERVIEW
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;

    try {
      const storedInterview =
        sessionStorage.getItem(
          "currentInterview"
        );

      if (!storedInterview) {
        navigate("/interview/setup", {
          replace: true,
        });

        return;
      }

      const parsedInterview =
        JSON.parse(storedInterview);

      if (
        !parsedInterview ||
        !Array.isArray(
          parsedInterview.questions
        ) ||
        parsedInterview.questions.length === 0
      ) {
        throw new Error(
          "No interview questions were found."
        );
      }

      setInterview(parsedInterview);

      const firstQuestion =
        parsedInterview.questions[0];

      currentQuestionRef.current =
        firstQuestion;

      questionIndexRef.current = 0;

      setQuestionIndex(0);
      setPrompt(firstQuestion.text);
    } catch (err) {
      console.error(
        "Interview loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load the interview."
      );
    }

    return () => {
      mountedRef.current = false;
    };
  }, [navigate]);

  // ============================================================
  // KEEP REFS IN SYNC
  // ============================================================

  useEffect(() => {
    questionIndexRef.current =
      questionIndex;
  }, [questionIndex]);

  useEffect(() => {
    parentAnswerIdRef.current =
      parentAnswerId;
  }, [parentAnswerId]);

  // ============================================================
  // LOAD CURRENT QUESTION
  // ============================================================

  const currentQuestion =
    interview?.questions?.[questionIndex];

  useEffect(() => {
    currentQuestionRef.current =
      currentQuestion || null;
  }, [currentQuestion]);

  // ============================================================
  // SPEECH VOICES
  // ============================================================

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    function loadVoices() {
      voicesRef.current =
        window.speechSynthesis.getVoices();
    }

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
    };
  }, []);

  // ============================================================
  // FIND INDIAN ENGLISH MALE VOICE
  // ============================================================

  function getIndianMaleVoice() {
    if (!("speechSynthesis" in window)) {
      return null;
    }

    const voices =
      voicesRef.current.length > 0
        ? voicesRef.current
        : window.speechSynthesis.getVoices();

    // Prefer Indian English male voice.
    const indianMale =
      voices.find(
        (voice) =>
          voice.lang?.toLowerCase() ===
            "en-in" &&
          /ravi|male|man/i.test(
            voice.name
          )
      );

    if (indianMale) {
      return indianMale;
    }

    // Any Indian English voice.
    const indianEnglish =
      voices.find(
        (voice) =>
          voice.lang?.toLowerCase() ===
          "en-in"
      );

    if (indianEnglish) {
      return indianEnglish;
    }

    // English male fallback.
    return voices.find(
      (voice) =>
        /ravi|male|man/i.test(
          voice.name
        ) &&
        voice.lang
          ?.toLowerCase()
          .startsWith("en")
    );
  }

  // ============================================================
  // CLEAR SILENCE MONITORING
  // ============================================================

  function clearSilenceMonitoring() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(
        silenceTimerRef.current
      );

      silenceTimerRef.current = null;
    }
  }

  // ============================================================
  // BUILD SPOKEN QUESTION
  // ============================================================

  function buildSpokenQuestion(
    questionText
  ) {
    const number =
      questionIndexRef.current + 1;

    const total =
      interview?.questions?.length || 0;

    return `
Question ${number} of ${total}.

${questionText}

Please take your time. I am listening.
`;
  }

  // ============================================================
  // SPEAK QUESTION
  // ============================================================

  function speakQuestion(questionText) {
    if (!mountedRef.current) {
      return;
    }

    if (!questionText) {
      startRecording();
      return;
    }

    // ---------------------------------------
    // Android native TTS
    // ---------------------------------------

    const nativeTts =
      window.AndroidTTS;

    if (nativeTts) {
      try {
        nativeTts.stop();

        nativeTts.speak(
          questionText
        );

        setStatus(
          "Here's your question."
        );

        const wordCount =
          questionText
            .trim()
            .split(/\s+/).length;

        setTimeout(() => {
          if (mountedRef.current) {
            startRecording();
          }
        }, Math.max(1200, wordCount * 520));

        return;
      } catch (nativeSpeechError) {
        console.warn(
          "Native speech failed:",
          nativeSpeechError
        );
      }
    }

    // ---------------------------------------
    // Browser TTS
    // ---------------------------------------

    if (
      !("speechSynthesis" in window)
    ) {
      setStatus(
        "I am ready when you are."
      );

      startRecording();

      return;
    }

    window.speechSynthesis.cancel();

    const voice =
      getIndianMaleVoice();

    const utterance =
      new SpeechSynthesisUtterance(
        questionText
      );

    if (voice) {
      utterance.voice = voice;
      utterance.lang =
        voice.lang || "en-IN";
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 1;

    speechRef.current =
      utterance;

    setStatus(
      "Here's your question."
    );

    utterance.onend = () => {
      speechRef.current = null;

      if (!mountedRef.current) {
        return;
      }

      setStatus(
        "I'm listening. Take your time."
      );

      setTimeout(() => {
        if (mountedRef.current) {
          startRecording();
        }
      }, 700);
    };

    utterance.onerror = () => {
      speechRef.current = null;

      if (!mountedRef.current) {
        return;
      }

      setStatus(
        "I am ready when you are."
      );

      setTimeout(() => {
        if (mountedRef.current) {
          startRecording();
        }
      }, 700);
    };

    window.speechSynthesis.speak(
      utterance
    );
  }

  // ============================================================
  // SILENCE MONITOR
  // ============================================================

  function monitorSilence() {
    const analyser =
      analyserRef.current;

    if (
      !analyser ||
      !recorderRef.current ||
      recorderRef.current.state !==
        "recording"
    ) {
      return;
    }

    const buffer = new Uint8Array(
      analyser.fftSize
    );

    analyser.getByteTimeDomainData(
      buffer
    );

    let sum = 0;

    for (const value of buffer) {
      const normalized =
        (value - 128) / 128;

      sum +=
        normalized * normalized;
    }

    const volume = Math.sqrt(
      sum / buffer.length
    );

    const recordingTime =
      Date.now() -
      recordingStartedAtRef.current;

    const candidateIsSilent =
      recordingTime >
        MIN_RECORDING_TIME &&
      volume <
        SILENCE_THRESHOLD;

    if (candidateIsSilent) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current =
          setTimeout(() => {
            stopRecording();
          }, SILENCE_LIMIT);
      }
    } else if (
      silenceTimerRef.current
    ) {
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

  // ============================================================
  // STOP RECORDING
  // ============================================================

  function stopRecording() {
    clearSilenceMonitoring();

    const recorder =
      recorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }
  }

  // ============================================================
  // POLL ANSWER
  // ============================================================

  async function pollAnswer(answerId) {
    if (!answerId) {
      throw new Error(
        "Answer ID was not returned by the server."
      );
    }

    try {
      const answer = await api(
        `/answers/${answerId}`
      );

      if (!mountedRef.current) {
        return;
      }

      // ---------------------------------------
      // Failed
      // ---------------------------------------

      if (
        answer.status === "failed"
      ) {
        throw new Error(
          answer.error_message ||
            "Answer analysis failed."
        );
      }

      // ---------------------------------------
      // IMPORTANT:
      // processing is NOT completed.
      // Keep polling until analyzed.
      // ---------------------------------------

      if (
        answer.status !== "analyzed"
      ) {
        setStatus(
          "I am analyzing your answer..."
        );

        setTimeout(() => {
          if (mountedRef.current) {
            pollAnswer(answerId);
          }
        }, 1500);

        return;
      }

      // ---------------------------------------
      // Get latest interview report
      // ---------------------------------------

      const report = await api(
        `/analysis/interviews/${interview.id}/report`
      );

      if (!mountedRef.current) {
        return;
      }

      const answers =
        Array.isArray(report?.answers)
          ? report.answers
          : [];

      const matchingAnswers =
        answers.filter(
          (item) =>
            String(item.answer_id) ===
            String(answerId)
        );

      const latestAnswer =
        matchingAnswers.sort(
          (first, second) =>
            new Date(
              second.created_at
            ) -
            new Date(
              first.created_at
            )
        )[0];

      const result =
        latestAnswer?.result;

      // ---------------------------------------
      // Result not available yet
      // ---------------------------------------

      if (!result) {
        setStatus(
          "I am finishing the analysis..."
        );

        setTimeout(() => {
          if (mountedRef.current) {
            pollAnswer(answerId);
          }
        }, 1500);

        return;
      }

      // ---------------------------------------
      // FOLLOW-UP
      // ---------------------------------------

      if (result.needsFollowUp) {
        const followUp =
          result.followUpQuestion ||
          "Could you explain your answer in more detail?";

        parentAnswerIdRef.current =
          answerId;

        setParentAnswerId(
          answerId
        );

        setPrompt(followUp);

        setStatus(
          "Thanks for explaining that. Let me explore that a little further."
        );

        setProcessingAnswer(
          false
        );

        speakQuestion(`
Thanks for explaining that. I would like to ask a follow-up question.

${followUp}

Please take your time. I am listening.
`);

        return;
      }

      // ---------------------------------------
      // NEXT QUESTION
      // ---------------------------------------

      const nextIndex =
        questionIndexRef.current + 1;

      if (
        nextIndex <
        interview.questions.length
      ) {
        const nextQuestion =
          interview.questions[
            nextIndex
          ];

        questionIndexRef.current =
          nextIndex;

        setQuestionIndex(
          nextIndex
        );

        parentAnswerIdRef.current =
          null;

        setParentAnswerId(null);

        currentQuestionRef.current =
          nextQuestion;

        setPrompt(
          nextQuestion.text
        );

        setProcessingAnswer(
          false
        );

        setStatus(
          "Good. Let's move to the next question."
        );

        setTimeout(() => {
          if (mountedRef.current) {
            speakQuestion(
              buildSpokenQuestion(
                nextQuestion.text
              )
            );
          }
        }, 500);

        return;
      }

      // ---------------------------------------
      // INTERVIEW COMPLETE
      // ---------------------------------------

      await finishInterview();
    } catch (requestError) {
      console.error(
        "Answer polling error:",
        requestError
      );

      if (!mountedRef.current) {
        return;
      }

      setProcessingAnswer(
        false
      );

      setError(
        requestError?.message ||
          "Unable to process your answer."
      );

      setStatus(
        "Something went wrong while processing your answer."
      );
    }
  }

  // ============================================================
  // FINISH INTERVIEW
  // ============================================================

  async function finishInterview() {
    if (
      interviewFinishedRef.current
    ) {
      return;
    }

    interviewFinishedRef.current =
      true;

    clearSilenceMonitoring();

    setStatus(
      "Thank you. That completes the interview."
    );

    try {
      await api(
        `/interviews/${interview.id}/finish`,
        {
          method: "POST",
        }
      );

      sessionStorage.setItem(
        "currentInterviewId",
        String(interview.id)
      );

      sessionStorage.removeItem(
        "currentInterview"
      );

      if (!mountedRef.current) {
        return;
      }

      navigate(
        "/interview/processing",
        {
          replace: true,
          state: {
            interviewId:
              interview.id,
          },
        }
      );
    } catch (finishError) {
      console.error(
        "Interview finish error:",
        finishError
      );

      interviewFinishedRef.current =
        false;

      if (!mountedRef.current) {
        return;
      }

      setError(
        finishError?.message ||
          "Unable to finish the interview."
      );

      setStatus(
        "Unable to finish the interview. Please try again."
      );
    }
  }

  // ============================================================
  // START RECORDING
  // ============================================================

  function startRecording() {
    if (!mountedRef.current) {
      return;
    }

    if (!streamRef.current) {
      setError(
        "Camera and microphone are not ready yet."
      );

      return;
    }

    if (
      processingAnswer ||
      interviewFinishedRef.current
    ) {
      return;
    }

    if (
      recorderRef.current?.state ===
      "recording"
    ) {
      return;
    }

    const currentQuestion =
      currentQuestionRef.current;

    if (!currentQuestion) {
      setError(
        "Current interview question could not be found."
      );

      return;
    }

    const chunks = [];

    let mimeType =
      "video/webm";

    if (
      MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp8,opus"
      )
    ) {
      mimeType =
        "video/webm;codecs=vp8,opus";
    } else if (
      MediaRecorder.isTypeSupported(
        "video/webm"
      )
    ) {
      mimeType = "video/webm";
    }

    let recorder;

    try {
      recorder =
        new MediaRecorder(
          streamRef.current,
          {
            mimeType,
            videoBitsPerSecond: 400000,
            audioBitsPerSecond: 64000,
          }
        );
    } catch (recorderError) {
      console.error(
        "MediaRecorder error:",
        recorderError
      );

      setError(
        "Your browser does not support video recording."
      );

      return;
    }

    recorder.ondataavailable =
      (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunks.push(event.data);
        }
      };

    recorder.onerror = (event) => {
      console.error(
        "Recorder error:",
        event
      );

      setRecording(false);

      clearSilenceMonitoring();

      setError(
        "Video recording failed. Please try again."
      );
    };

    recorder.onstop = async () => {
      clearSilenceMonitoring();

      if (!mountedRef.current) {
        return;
      }

      setRecording(false);
      setProcessingAnswer(true);
      setError("");

      setStatus(
        "Thank you. Let me think about that."
      );

      try {
        if (chunks.length === 0) {
          throw new Error(
            "No video was recorded. Please try answering again."
          );
        }

        const videoBlob =
          new Blob(chunks, {
            type: mimeType,
          });

        if (videoBlob.size === 0) {
          throw new Error(
            "The recorded video is empty."
          );
        }

        const formData =
          new FormData();

        formData.append(
          "video",
          videoBlob,
          "answer.webm"
        );

        formData.append(
          "interviewQuestionId",
          currentQuestion
            .interview_question_id
        );

        if (
          parentAnswerIdRef.current
        ) {
          formData.append(
            "parentAnswerId",
            parentAnswerIdRef.current
          );
        }

        const answer =
          await api(
            `/interviews/${interview.id}/answers`,
            {
              method: "POST",
              body: formData,
            }
          );

        if (!answer?.id) {
          throw new Error(
            "The server did not return an answer ID."
          );
        }

        if (!mountedRef.current) {
          return;
        }

        setStatus(
          "I am considering your answer..."
        );

        await pollAnswer(
          answer.id
        );
      } catch (requestError) {
        console.error(
          "Answer upload error:",
          requestError
        );

        if (!mountedRef.current) {
          return;
        }

        setProcessingAnswer(
          false
        );

        setError(
          requestError?.message ||
            "Unable to upload your answer."
        );

        setStatus(
          "Something went wrong. Please try answering again."
        );
      }
    };

    recorderRef.current =
      recorder;

    recordingStartedAtRef.current =
      Date.now();

    try {
      recorder.start();

      setRecording(true);

      setStatus(
        canAutoSubmit
          ? "I'm listening. Take your time."
          : "Recording your answer. Tap Submit answer when you are done."
      );

      if (canAutoSubmit) {
        monitorSilence();
      }
    } catch (startError) {
      console.error(
        "Recording start error:",
        startError
      );

      setError(
        "Unable to start recording."
      );
    }
  }

  // ============================================================
  // MEDIA SETUP
  // ============================================================

  useEffect(() => {
    if (!interview) {
      return;
    }

    let mounted = true;

    async function setupMedia() {
      let stream = null;
      let audioStream = null;
      let videoStream = null;
      let audioContext = null;

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Camera and microphone are not available in this browser."
          );
        }

        const videoConstraints = {
          width: {
            ideal: 640,
            max: 640,
          },
          height: {
            ideal: 360,
            max: 360,
          },
          frameRate: {
            ideal: 15,
            max: 15,
          },
          facingMode: "user",
        };

        // ---------------------------------------
        // Microphone
        // ---------------------------------------

        setStatus(
          "Opening your microphone..."
        );

        try {
          audioStream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: false,
                audio: true,
              }
            );
        } catch (audioError) {
          console.error(
            "Microphone failed:",
            audioError
          );
        }

        // ---------------------------------------
        // Camera
        // ---------------------------------------

        setStatus(
          "Opening your camera..."
        );

        videoStream =
          await navigator.mediaDevices.getUserMedia(
            {
              video:
                videoConstraints,
              audio: false,
            }
          );

        // ---------------------------------------
        // Combine camera + microphone
        // ---------------------------------------

        if (
          audioStream &&
          audioStream.getAudioTracks()
            .length > 0
        ) {
          stream =
            new MediaStream([
              ...videoStream.getVideoTracks(),
              ...audioStream.getAudioTracks(),
            ]);

          setCanAutoSubmit(true);

          setError("");
        } else {
          stream =
            videoStream;

          setCanAutoSubmit(false);

          setError(
            "Microphone could not start on this device. Camera recording is enabled. Tap Submit answer when you finish."
          );
        }

        if (!mounted) {
          stream
            ?.getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        streamRef.current =
          stream;

        // ---------------------------------------
        // Camera preview
        // ---------------------------------------

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn(
              "Video playback warning:",
              playError
            );
          }
        }

        // ---------------------------------------
        // Audio analyser
        // ---------------------------------------

        if (
          stream.getAudioTracks()
            .length > 0
        ) {
          const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

          if (AudioContextClass) {
            audioContext =
              new AudioContextClass();

            if (
              audioContext.state ===
              "suspended"
            ) {
              await audioContext
                .resume()
                .catch(() => {});
            }

            const source =
              audioContext.createMediaStreamSource(
                stream
              );

            const analyser =
              audioContext.createAnalyser();

            analyser.fftSize =
              512;

            source.connect(
              analyser
            );

            audioContextRef.current =
              audioContext;

            analyserRef.current =
              analyser;

            setCanAutoSubmit(
              true
            );
          } else {
            setCanAutoSubmit(
              false
            );
          }
        }

        if (!mounted) {
          return;
        }

        setStatus(
          "Here is your question."
        );

        // ---------------------------------------
        // Speak first question
        // ---------------------------------------

        setTimeout(() => {
          if (
            mounted &&
            currentQuestionRef.current
          ) {
            speakQuestion(
              buildSpokenQuestion(
                currentQuestionRef
                  .current.text
              )
            );
          }
        }, 500);
      } catch (mediaError) {
        stream
          ?.getTracks()
          .forEach((track) =>
            track.stop()
          );

        audioStream
          ?.getTracks()
          .forEach((track) =>
            track.stop()
          );

        videoStream
          ?.getTracks()
          .forEach((track) =>
            track.stop()
          );

        audioContext?.close();

        const details = {
          name:
            mediaError?.name ||
            "MediaError",

          message:
            mediaError?.message ||
            String(mediaError),

          constraint:
            mediaError?.constraint ||
            null,

          secureContext:
            window.isSecureContext,

          origin:
            window.location.origin,
        };

        console.error(
          "Media access failed:",
          details
        );

        if (!mounted) {
          return;
        }

        setError(
          `${details.name}: ${details.message}`
        );

        setStatus(
          "I am unable to access your camera."
        );
      }
    }

    setupMedia();

    // ---------------------------------------
    // Cleanup
    // ---------------------------------------

    return () => {
      mounted = false;

      clearSilenceMonitoring();

      if (
        "speechSynthesis" in
        window
      ) {
        window.speechSynthesis.cancel();
      }

      window.AndroidTTS?.stop?.();

      if (
        recorderRef.current &&
        recorderRef.current.state !==
          "inactive"
      ) {
        try {
          recorderRef.current.stop();
        } catch {}
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current =
        null;

      audioContextRef.current?.close();

      audioContextRef.current =
        null;

      analyserRef.current =
        null;
    };
  }, [interview]);

  // ============================================================
  // ERROR / LOADING STATES
  // ============================================================

  if (!interview) {
    return (
      <main className="mobile-page loading-page">
        <div className="loading-spinner" />

        <h2>
          Preparing your interview...
        </h2>

        {error && (
          <>
            <p className="error">
              {error}
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                navigate(
                  "/interview/setup"
                )
              }
            >
              Back to Setup
            </button>
          </>
        )}
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="mobile-page">
        <div className="page-header">
          <div className="eyebrow">
            INTERVIEW
          </div>

          <h1>
            Something went wrong
          </h1>

          <p>
            We couldn't find the current
            interview question.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={() =>
            navigate(
              "/interview/setup"
            )
          }
        >
          Start Again
        </button>
      </main>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="mobile-page live-interview-page">
      {/* Header */}
      <header className="live-header">
        <div>
          <div className="eyebrow">
            LIVE INTERVIEW
          </div>

          <strong>
            Question{" "}
            {questionIndex + 1}{" "}
            of{" "}
            {interview.questions.length}
          </strong>
        </div>

        <div
          className={
            recording
              ? "recording-pill active"
              : "recording-pill"
          }
        >
          <span />
          {recording
            ? "Recording"
            : processingAnswer
            ? "Analyzing"
            : "Ready"}
        </div>
      </header>

      {/* Camera */}
      <section className="live-camera-card">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
        />

        <div className="camera-status">
          <span />
          Camera ready
        </div>

        {recording && (
          <div className="camera-recording">
            <span className="pulse-dot" />
            REC
          </div>
        )}
      </section>

      {/* Question */}
      <section className="question-card">
        <p className="status">
          {status}
        </p>

        <h1>{prompt}</h1>

        <p className="listening-help">
          {canAutoSubmit
            ? "I am listening. Your answer will be submitted automatically after 3 seconds of silence."
            : "Tap Submit answer when you finish speaking."}
        </p>
      </section>

      {/* Recording indicator */}
      {recording && (
        <div className="live-recording-state">
          <span className="pulse-dot" />

          <span>
            I'm listening. Take your time.
          </span>
        </div>
      )}

      {/* Manual submit */}
      {recording &&
        !canAutoSubmit && (
          <button
            type="button"
            className="primary-btn"
            onClick={stopRecording}
          >
            Submit Answer
          </button>
        )}

      {/* Processing */}
      {processingAnswer &&
        !recording && (
          <div className="answer-processing">
            <div className="loading-spinner" />

            <p>
              Your answer is being
              analyzed...
            </p>
          </div>
        )}

      {/* Error */}
      {error && (
        <div className="live-error">
          <strong>
            Something went wrong
          </strong>

          <p>{error}</p>

          {!recording &&
            !processingAnswer && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setError("");

                  setStatus(
                    "I am ready when you are."
                  );

                  speakQuestion(
                    buildSpokenQuestion(
                      currentQuestion.text
                    )
                  );
                }}
              >
                Try Again
              </button>
            )}
        </div>
      )}

      {/* Progress */}
      <div className="interview-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${
                ((questionIndex + 1) /
                  interview.questions
                    .length) *
                100
              }%`,
            }}
          />
        </div>

        <span>
          {questionIndex + 1} /{" "}
          {interview.questions.length}
        </span>
      </div>
    </main>
  );
}