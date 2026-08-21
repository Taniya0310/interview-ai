const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const ffmpegPath = require("ffmpeg-static");
const gemini = require("./geminiService");
const logger = require("../utils/logger");

function createTempAudioPath() {
  const filename = `interview-audio-${crypto
    .randomBytes(8)
    .toString("hex")}.wav`;

  return path.join(os.tmpdir(), filename);
}

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, [
      "-y",
      "-i",
      videoPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "pcm_s16le",
      audioPath,
    ]);

    let errorOutput = "";

    process.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });

    process.on("error", reject);

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Audio extraction failed with code ${code}: ${errorOutput}`
        )
      );
    });
  });
}

async function evaluateVideoAudio({
  videoPath,
  question,
  expectedTopics = [],
}) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  if (!ffmpegPath) {
    throw new Error("FFmpeg is not available");
  }

  const audioPath = createTempAudioPath();

  try {
    logger.info("Extracting audio from interview video", {
      videoPath,
      audioPath,
    });

    await extractAudio(videoPath, audioPath);

    logger.info(
      "Audio extracted; sending one combined request to Gemini",
      {
        audioPath,
      }
    );

    const result = await gemini.evaluateAudioAnswer({
      filePath: audioPath,
      mimeType: "audio/wav",
      question,
      expectedTopics,
    });

    logger.info("Audio transcript and evaluation completed", {
      transcript: result.transcript || "[Transcript unavailable]",
      needsFollowUp: result.needsFollowUp,
      followUpQuestion: result.followUpQuestion,
      questionFeedback: result.questionFeedback,
    });

    return result;
  } finally {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);

      logger.info("Temporary extracted audio deleted", {
        audioPath,
      });
    }
  }
}

module.exports = {
  evaluateVideoAudio,
};