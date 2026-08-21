import React, { useEffect, useRef, useState } from 'react';

const API =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Ignore invalid error response bodies.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function Setup({ onStart, onAdmin }) {
  const [form, setForm] = useState({
    interviewType: 'technical',
    role: 'backend-developer',
    difficulty: 'beginner',
    questionCount: 3,
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }
async function handleSubmit(event) {
  event.preventDefault();

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();

      const unlockSpeech =
        new SpeechSynthesisUtterance('Starting interview');

      unlockSpeech.lang = 'en-IN';
      unlockSpeech.volume = 1;
      unlockSpeech.rate = 1;

      window.speechSynthesis.speak(unlockSpeech);
    } catch (speechError) {
      console.warn('Speech unlock failed:', speechError);
    }
  }

  await onStart(form);
}

  return (
    <main className="card narrow">
      <h1>Interview AI</h1>
      <p>Start an adaptive video interview.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Interview type
          <input
            name="interviewType"
            value={form.interviewType}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Role
          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Difficulty
          <input
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Number of questions
          <input
            name="questionCount"
            type="number"
            min="1"
            max="100"
            value={form.questionCount}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit">Start interview</button>
      </form>

      <button
        type="button"
        className="secondary"
        onClick={onAdmin}
      >
        Admin question bank
      </button>
    </main>
  );
}


function LiveInterview({ interview, onComplete }) {
  const videoRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const recordingStartedAtRef = useRef(null);

  const speechRef = useRef(null);
  const voicesRef = useRef([]);

  const questionIndexRef = useRef(0);
  const parentAnswerIdRef = useRef(null);
  const currentQuestionRef = useRef(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [prompt, setPrompt] = useState(
    interview.questions[0]?.text || ''
  );
  const [parentAnswerId, setParentAnswerId] = useState(null);
const [recording, setRecording] = useState(false);
const [canAutoSubmit, setCanAutoSubmit] = useState(true);
const [status, setStatus] = useState(
    'Let me get everything ready for you...'
  );
  const [error, setError] = useState('');

  const currentQuestion = interview.questions[questionIndex];

  const SILENCE_LIMIT = 3000;
  const MIN_RECORDING_TIME = 1500;
  const SILENCE_THRESHOLD = 0.015;

  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  useEffect(() => {
    parentAnswerIdRef.current = parentAnswerId;
  }, [parentAnswerId]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    const nativeTts = window.AndroidTTS;

    if (nativeTts) {
      try {
        nativeTts.stop();
        nativeTts.speak(questionText);
        setStatus('HereÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s your question.');
        const wordCount = questionText.trim().split(/\s+/).length;
        setTimeout(startRecording, Math.max(1200, wordCount * 520));
        return;
      } catch (nativeSpeechError) {
        console.warn('Native speech failed:', nativeSpeechError);
      }
    }

    if (!('speechSynthesis' in window)) {
      return undefined;
    }

    function loadVoices() {
      voicesRef.current =
        window.speechSynthesis.getVoices();
    }

    loadVoices();

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        'voiceschanged',
        loadVoices
      );
    };
  }, []);

  function getIndianMaleVoice() {
    const voices =
      voicesRef.current.length > 0
        ? voicesRef.current
        : window.speechSynthesis.getVoices();

    return (
      voices.find(
        (voice) =>
          voice.lang.toLowerCase() === 'en-in' &&
          /ravi|male|man/i.test(voice.name)
      ) ||
      voices.find(
        (voice) =>
          voice.lang.toLowerCase() === 'en-in'
      ) ||
      voices.find(
        (voice) =>
          /ravi|male|man/i.test(voice.name) &&
          voice.lang.toLowerCase().startsWith('en')
      )
    );
  }

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

  function stopRecording() {
    clearSilenceMonitoring();

    if (
      recorderRef.current &&
      recorderRef.current.state !== 'inactive'
    ) {
      recorderRef.current.stop();
    }
  }
function buildSpokenQuestion(questionText) {
  const number = questionIndexRef.current + 1;
  const total = interview.questions.length;

  return `
Question ${number} of ${total}.
${questionText}
Please take your time. I am listening.
`;
}
  function speakQuestion(questionText) {
    if (!questionText) {
      startRecording();
      return;
    }

    const nativeTts = window.AndroidTTS;

    if (nativeTts) {
      try {
        nativeTts.stop();
        nativeTts.speak(questionText);
        setStatus('HereÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s your question.');
        const wordCount = questionText.trim().split(/\s+/).length;
        setTimeout(startRecording, Math.max(1200, wordCount * 520));
        return;
      } catch (nativeSpeechError) {
        console.warn('Native speech failed:', nativeSpeechError);
      }
    }

    if (!('speechSynthesis' in window)) {
      setStatus('I am ready when you are.');
      startRecording();
      return;
    }

    window.speechSynthesis.cancel();

    const voice = getIndianMaleVoice();

  window.speechSynthesis.cancel();

const utterance =
  new SpeechSynthesisUtterance(questionText);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 1;

    speechRef.current = utterance;
    setStatus('Here is your question.');

    utterance.onend = () => {
      speechRef.current = null;
      setStatus('I am listening. Take your time.');

      setTimeout(startRecording, 700);
    };

    utterance.onerror = () => {
      speechRef.current = null;
      setStatus('I am ready when you are.');

      setTimeout(startRecording, 700);
    };

    window.speechSynthesis.speak(utterance);
  }

  function monitorSilence() {
    const analyser = analyserRef.current;

    if (!analyser || !recorderRef.current) {
      return;
    }

    const buffer = new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(buffer);

    let sum = 0;

    for (const value of buffer) {
      const normalized = (value - 128) / 128;
      sum += normalized * normalized;
    }

    const volume = Math.sqrt(sum / buffer.length);

    const recordingTime =
      Date.now() - recordingStartedAtRef.current;

    const candidateIsSilent =
      recordingTime > MIN_RECORDING_TIME &&
      volume < SILENCE_THRESHOLD;

    if (candidateIsSilent) {
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(
          stopRecording,
          SILENCE_LIMIT
        );
      }
    } else if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    animationFrameRef.current =
      requestAnimationFrame(monitorSilence);
  }

  async function pollAnswer(answerId) {
    try {
      const answer = await api(`/answers/${answerId}`);

      if (answer.status === 'failed') {
        throw new Error(
          answer.error_message || 'Answer analysis failed'
        );
      }

      if (
        !['analyzed', 'processing'].includes(answer.status)
      ) {
        setTimeout(() => pollAnswer(answerId), 1500);
        return;
      }

      const report = await api(
        `/analysis/interviews/${interview.id}/report`
      );

      const result = report.answers
        .filter((item) => item.answer_id === answerId)
        .sort(
          (first, second) =>
            new Date(second.created_at) -
            new Date(first.created_at)
        )[0]?.result;

      if (!result) {
        setTimeout(() => pollAnswer(answerId), 1500);
        return;
      }

      if (result.needsFollowUp) {
        const followUp =
          result.followUpQuestion ||
          'Could you explain your answer in more detail?';

        parentAnswerIdRef.current = answerId;
        setParentAnswerId(answerId);
        setPrompt(followUp);

        setStatus(
          'Thanks for explaining that. I would like to ask one more thing.'
        );

        speakQuestion(`
Thanks for explaining that. I would like to ask a follow-up question.
${followUp}
Please take your time. I am listening.
`);
        return;
      }

      const nextIndex =
        questionIndexRef.current + 1;

      if (nextIndex < interview.questions.length) {
        const nextQuestion =
          interview.questions[nextIndex];

        questionIndexRef.current = nextIndex;
        setQuestionIndex(nextIndex);

        parentAnswerIdRef.current = null;
        setParentAnswerId(null);
        setPrompt(nextQuestion.text);

        setStatus(
          'Good. Let us move to the next question.'
        );

        speakQuestion(
  buildSpokenQuestion(nextQuestion.text)
);
        return;
      }

      setStatus(
        'Thank you. That completes the interview.'
      );

      await api(`/interviews/${interview.id}/finish`, {
        method: 'POST',
      });

      onComplete(interview.id);
    } catch (requestError) {
      setError(requestError.message);

      setStatus(
        'I am sorry, something went wrong. Let us try that again.'
      );
    }
  }

  function startRecording() {
    if (!streamRef.current) {
      setError(
        'Camera and microphone are not ready yet.'
      );
      return;
    }

    if (recorderRef.current?.state === 'recording') {
      return;
    }

    const chunks = [];

    const mimeType = MediaRecorder.isTypeSupported(
      'video/webm;codecs=vp8,opus'
    )
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(
      streamRef.current,
      {
        mimeType,
        videoBitsPerSecond: 400000,
        audioBitsPerSecond: 64000,
      }
    );

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      clearSilenceMonitoring();
      setRecording(false);
      setStatus(
        'Thank you. Let me think about that for a moment.'
      );
      setError('');

      try {
        const videoBlob = new Blob(chunks, {
          type: 'video/webm',
        });

        const formData = new FormData();

        formData.append(
          'video',
          videoBlob,
          'answer.webm'
        );

        formData.append(
          'interviewQuestionId',
          currentQuestionRef.current
            .interview_question_id
        );

        if (parentAnswerIdRef.current) {
          formData.append(
            'parentAnswerId',
            parentAnswerIdRef.current
          );
        }

        const answer = await api(
          `/interviews/${interview.id}/answers`,
          {
            method: 'POST',
            body: formData,
          }
        );

        setStatus('I am considering your answer...');

        await pollAnswer(answer.id);
      } catch (requestError) {
        setError(requestError.message);

        setStatus(
          'I am sorry, something went wrong. Let us try that again.'
        );
      }
    };

    recorderRef.current = recorder;
    recordingStartedAtRef.current = Date.now();

  recorder.start();
setRecording(true);
setStatus(
  canAutoSubmit
    ? 'I am listening. Take your time.'
    : 'Recording your answer. Tap Submit answer when you are done.'
);

if (canAutoSubmit) {
  monitorSilence();
}
  }

  useEffect(() => {
    let mounted = true;

async function setupMedia() {
  let stream = null;
  let audioStream = null;
  let videoStream = null;
  let audioContext = null;

  try {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        'Camera and microphone are not available in this WebView.'
      );
    }

    const videoConstraints = {
      width: { ideal: 640, max: 640 },
      height: { ideal: 360, max: 360 },
      frameRate: { ideal: 15, max: 15 },
      facingMode: 'user',
    };

    setStatus('Opening your microphone...');

    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
    } catch (audioError) {
      console.error('Microphone failed:', audioError);
    }

    setStatus('Opening your camera...');

    videoStream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });

    if (audioStream) {
      stream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      setCanAutoSubmit(true);
      setError('');
    } else {
      stream = videoStream;

      setCanAutoSubmit(false);
      setError(
        'Microphone could not start on this phone, so camera recording is enabled. Tap Submit answer when you finish.'
      );
    }

    if (!mounted) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      try {
        await videoRef.current.play();
      } catch (playError) {
        console.warn('Video playback warning:', playError);
      }
    }

    if (stream.getAudioTracks().length > 0) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        audioContext = new AudioContextClass();

        if (audioContext.state === 'suspended') {
          await audioContext.resume().catch(() => {});
        }

        const source =
          audioContext.createMediaStreamSource(stream);

        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 512;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        setCanAutoSubmit(true);
      } else {
        setCanAutoSubmit(false);
      }
    }

    setStatus('Here is your question.');

    setTimeout(() => {
      if (mounted && currentQuestionRef.current) {
        speakQuestion(
          buildSpokenQuestion(currentQuestionRef.current.text)
        );
      }
    }, 500);
  } catch (mediaError) {
    stream?.getTracks().forEach((track) => track.stop());
    audioStream?.getTracks().forEach((track) => track.stop());
    videoStream?.getTracks().forEach((track) => track.stop());
    audioContext?.close();

    const details = {
      name: mediaError?.name || 'MediaError',
      message: mediaError?.message || String(mediaError),
      constraint: mediaError?.constraint || null,
      secureContext: window.isSecureContext,
      origin: window.location.origin,
    };

    console.error(
      'Media access failed:',
      JSON.stringify(details)
    );

    setError(`${details.name}: ${details.message}`);
    setStatus('I am unable to access your camera.');
  }
}
    setupMedia();

    return () => {
      mounted = false;

      clearSilenceMonitoring();

      window.speechSynthesis?.cancel();
      window.AndroidTTS?.stop();

      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      audioContextRef.current?.close();
    };
  }, []);

  if (!currentQuestion) {
    return (
      <main className="card">
        <h2>Let us try starting the interview again.</h2>
      </main>
    );
  }

  return (
    <main className="card live">
      <p className="status">{status}</p>

      {error && (
        <p className="error">{error}</p>
      )}

      <h2>
        Question {questionIndex + 1} of{' '}
        {interview.questions.length}
      </h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
      />

      <h1>{prompt}</h1>

      <p>
  {canAutoSubmit
    ? 'I am listening. Your answer will be submitted automatically after 3 seconds of silence.'
    : 'Tap Submit answer when you finish speaking.'}
</p>

{recording && (
  <>
    <p className="recording-indicator">
      ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ I am listening
    </p>

    {!canAutoSubmit && (
      <button type="button" onClick={stopRecording}>
        Submit answer
      </button>
    )}
  </>
)}
    </main>
  );
}

function Report({ interviewId, onHome }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      try {
        const data = await api(
          `/analysis/interviews/${interviewId}/report`
        );

        if (mounted) {
          setReport(data);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message);
        }
      }
    }

    loadReport();

    return () => {
      mounted = false;
    };
  }, [interviewId]);

  if (error) {
    return (
      <main className="card">
        <h2>Unable to load report</h2>
        <p className="error">{error}</p>
        <button type="button" onClick={onHome}>
          New interview
        </button>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="card">
        <h2>Loading report...</h2>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Interview report</h1>

      <div className="scores">
        {Object.entries(report.scores || {}).map(
          ([name, score]) => (
            <div key={name}>
              <strong>{score}</strong>
              <small>{name}</small>
            </div>
          )
        )}
      </div>

      {report.answers.map((answer, index) => (
        <article
          className="feedback"
          key={`${answer.answer_id}-${index}`}
        >
          <h3>
            {index + 1}. {answer.question}
          </h3>

          {answer.result?.metricsPending && (
            <p>Detailed metrics are still processing.</p>
          )}

          <pre>
            {JSON.stringify(answer.result, null, 2)}
          </pre>
        </article>
      ))}

      <button type="button" onClick={onHome}>
        New interview
      </button>
    </main>
  );
}

function Admin({ onHome }) {
  const [questions, setQuestions] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function loadQuestions() {
    try {
      const data = await api('/questions?isActive=true');
      setQuestions(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  async function addQuestion(event) {
    event.preventDefault();

    try {
      await api('/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewType: 'technical',
          role: 'backend-developer',
          difficulty: 'beginner',
          text,
          expectedTopics: [],
        }),
      });

      setText('');
      await loadQuestions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteQuestion(questionId) {
    try {
      await api(`/questions/${questionId}`, {
        method: 'DELETE',
      });

      await loadQuestions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="card">
      <button
        type="button"
        className="link"
        onClick={onHome}
      >
        Back
      </button>

      <h1>Admin question bank</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={addQuestion}>
        <input
          required
          value={text}
          onChange={(event) =>
            setText(event.target.value)
          }
          placeholder="Question text"
        />

        <button type="submit">Add question</button>
      </form>

      {questions.map((question) => (
        <div className="row" key={question.id}>
          <span>{question.text}</span>

          <button
            type="button"
            className="danger"
            onClick={() =>
              deleteQuestion(question.id)
            }
          >
            Delete
          </button>
        </div>
      ))}
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState('setup');
  const [interview, setInterview] = useState(null);
  const [reportId, setReportId] = useState(null);

  async function startInterview(form) {
    try {
      const createdInterview = await api('/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      setInterview(createdInterview);
      setPage('live');
    } catch (requestError) {
      window.alert(requestError.message);
    }
  }

  if (page === 'admin') {
    return <Admin onHome={() => setPage('setup')} />;
  }

  if (page === 'live' && interview) {
    return (
      <LiveInterview
        interview={interview}
        onComplete={(id) => {
          setReportId(id);
          setPage('report');
        }}
      />
    );
  }

  if (page === 'report' && reportId) {
    return (
      <Report
        interviewId={reportId}
        onHome={() => {
          setInterview(null);
          setReportId(null);
          setPage('setup');
        }}
      />
    );
  }

  return (
    <Setup
      onStart={startInterview}
      onAdmin={() => setPage('admin')}
    />
  );
}
