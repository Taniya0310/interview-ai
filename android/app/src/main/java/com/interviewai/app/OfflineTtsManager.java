package com.interviewai.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Process;
import android.util.Log;

import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.TtsKt;
import java.util.concurrent.ThreadLocalRandom;
import java.io.File;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public final class OfflineTtsManager {

    private static final String TAG = "OfflineTTS";

    private final ModelDownloader modelDownloader;

    private final BlockingQueue<TtsJob> generationQueue =
            new LinkedBlockingQueue<>();

    private final BlockingQueue<AudioChunk> playbackQueue =
            new LinkedBlockingQueue<>();

    private final AtomicBoolean running =
            new AtomicBoolean(true);

    private final AtomicBoolean ready =
            new AtomicBoolean(false);

    private volatile OfflineTts ryanTts;
private volatile OfflineTts femaleTts;
    private volatile AudioTrack audioTrack;

    private Thread initializationThread;
    private Thread generationThread;
    private Thread playbackThread;

    public OfflineTtsManager(Context context) {
        modelDownloader =
                new ModelDownloader(
                        context.getApplicationContext()
                );
    }

   public void initialize(
        ModelDownloader.DownloadListener listener
) {
    initializationThread =
            new Thread(
                    () -> {
                        try {
                            Log.i(
                                    TAG,
                                    "TTS_INITIALIZATION_START"
                            );

                            
                                    modelDownloader.downloadAndExtract(
                                            listener
                                    );

                            File ryanDirectory =
                                    modelDownloader.getModelDirectory(
                                            ModelDownloader.RYAN_VOICE_ID
                                    );

                            File femaleDirectory =
                                    modelDownloader.getModelDirectory(
                                            ModelDownloader.FEMALE_VOICE_ID
                                    );

                            ryanTts =
                                    createEngine(
                                            ryanDirectory,
                                            "en_US-ryan-medium.onnx"
                                    );

                            femaleTts =
                                    createEngine(
                                            femaleDirectory,
                                            "en_US-hfc_female-medium.onnx"
                                    );

                            int sampleRate =
                                    ryanTts.sampleRate();

                            Log.i(
                                    TAG,
                                    "RYAN_MODEL_READY path="
                                            + ryanDirectory
                            );

                            Log.i(
                                    TAG,
                                    "FEMALE_MODEL_READY path="
                                            + femaleDirectory
                            );

                            createAudioTrack(sampleRate);

                            ready.set(true);
                            startWorkers();

                            Log.i(TAG, "TTS_READY");

                        } catch (Exception error) {
                            ready.set(false);

                            Log.e(
                                    TAG,
                                    "TTS_INITIALIZATION_ERROR",
                                    error
                            );

                            if (listener != null) {
                                listener.onError(error);
                            }
                        }
                    },
                    "OfflineTTS-Initialization"
            );

    initializationThread.start();
}

private OfflineTts createEngine(
        File modelDirectory,
        String modelFileName
) {
    String dataDirectory =
            new File(
                    modelDirectory,
                    "espeak-ng-data"
            ).getAbsolutePath();

    OfflineTtsConfig config =
            TtsKt.getOfflineTtsConfig(
                    modelDirectory.getAbsolutePath(),
                    modelFileName,
                    "",
                    "",
                    "",
                    "tokens.txt",
                    dataDirectory,
                    "",
                    "",
                    "",
                    1,
                    false,
                    false,
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
            );

    return new OfflineTts(
            null,
            config
    );
}

public boolean isReady() {
    return ready.get()
            && ryanTts != null
            && femaleTts != null;
}
public void enqueue(
        String text,
        String chunkId,
        float speechRate,
        float speechPitch,
        float speechVolume
) {
    enqueue(
            text,
            chunkId,
            ModelDownloader.RYAN_VOICE_ID,
            speechRate,
            speechPitch,
            speechVolume
    );
}
 public void enqueue(
        String text,
        String chunkId,
        String voiceId,
        float speechRate,
        float speechPitch,
        float speechVolume
) {
    if (text == null || text.trim().isEmpty()) {
        return;
    }

    if (!isReady()) {
        Log.w(TAG, "TTS_NOT_READY id=" + chunkId);
        return;
    }

    if (!ModelDownloader.FEMALE_VOICE_ID.equalsIgnoreCase(voiceId)) {
        voiceId = ModelDownloader.RYAN_VOICE_ID;
    }

    generationQueue.offer(
            new TtsJob(
                    text.trim(),
                    chunkId,
                    voiceId,
                    System.nanoTime(),
                    speechRate,
                    speechPitch,
                    speechVolume
            )
    );
}
    public void stop() {
        Log.i(TAG, "TTS_STOP");

        generationQueue.clear();
        playbackQueue.clear();

        AudioTrack track = audioTrack;

        if (track != null) {
            try {
                track.pause();
                track.flush();
                track.stop();
            } catch (Exception error) {
                Log.w(
                        TAG,
                        "AUDIO_TRACK_STOP_ERROR",
                        error
                );
            }
        }
    }

    public void clearQueue() {
        generationQueue.clear();
        playbackQueue.clear();

        Log.i(TAG, "TTS_QUEUE_CLEARED");
    }

    private void createAudioTrack(int sampleRate) {
        int minimumBufferSize =
                AudioTrack.getMinBufferSize(
                        sampleRate,
                        AudioFormat.CHANNEL_OUT_MONO,
                        AudioFormat.ENCODING_PCM_16BIT
                );

        int bufferSize =
                Math.max(
                        minimumBufferSize,
                        sampleRate * 2
                );

        AudioAttributes attributes =
                new AudioAttributes.Builder()
                        .setUsage(
                                AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY
                        )
                        .setContentType(
                                AudioAttributes.CONTENT_TYPE_SPEECH
                        )
                        .build();

        AudioFormat format =
                new AudioFormat.Builder()
                        .setSampleRate(sampleRate)
                        .setEncoding(
                                AudioFormat.ENCODING_PCM_16BIT
                        )
                        .setChannelMask(
                                AudioFormat.CHANNEL_OUT_MONO
                        )
                        .build();

        audioTrack =
                new AudioTrack(
                        attributes,
                        format,
                        bufferSize,
                        AudioTrack.MODE_STREAM,
                        AudioManager.AUDIO_SESSION_ID_GENERATE
                );

        Log.i(
                TAG,
                "AUDIO_TRACK_READY buffer="
                        + bufferSize
        );
    }

    private void startWorkers() {
        generationThread =
                new Thread(
                        this::generationLoop,
                        "OfflineTTS-Generation"
                );

        playbackThread =
                new Thread(
                        this::playbackLoop,
                        "OfflineTTS-Playback"
                );

        generationThread.start();
        playbackThread.start();
    }

    private void generationLoop() {
        Process.setThreadPriority(
                Process.THREAD_PRIORITY_BACKGROUND
        );

        while (running.get()) {
            try {
                TtsJob job =
                        generationQueue.poll(
                                500,
                                TimeUnit.MILLISECONDS
                        );

                if (job == null) {
                    continue;
                }

                OfflineTts engine =
        ModelDownloader.FEMALE_VOICE_ID.equalsIgnoreCase(
                job.voiceId
        )
                ? femaleTts
                : ryanTts;

                if (engine == null) {
                    Log.w(
                            TAG,
                            "PIPER_ENGINE_NOT_READY"
                    );
                    continue;
                }

                long generationStart =
                        System.nanoTime();

                double queueWaitMs =
                        nanosToMilliseconds(
                                generationStart
                                        - job.enqueueTime
                        );

                Log.d(
                        TAG,
                        "GENERATE_START id="
                                + job.id
                                + " queueWaitMs="
                                + round(queueWaitMs)
                );

                GeneratedAudio generated =
        engine.generate(
                job.text,
                0,
                job.speechRate
        );

                long generationEnd =
                        System.nanoTime();

                float[] samples =
                        generated.getSamples();

                int sampleRate =
                        generated.getSampleRate();

                short[] pcm =
        convertToPcm16(
                samples,
                job.speechVolume
        );

                double generationMs =
                        nanosToMilliseconds(
                                generationEnd
                                        - generationStart
                        );

                double audioMs =
                        pcm.length
                                * 1000.0
                                / sampleRate;

                double rtf =
                        audioMs == 0
                                ? 0
                                : generationMs / audioMs;

                long generatedAtNs =
                        System.nanoTime();

                playbackQueue.put(
                        new AudioChunk(
                                job.id,
                                pcm,
                                sampleRate,
                                generationMs,
                                audioMs,
                                rtf,
                                generatedAtNs
                        )
                );

                Log.d(
                        TAG,
                        "TIMING_GENERATED id="
                                + job.id
                                + " queueWaitMs="
                                + round(queueWaitMs)
                                + " generationMs="
                                + round(generationMs)
                                + " audioMs="
                                + round(audioMs)
                                + " rtf="
                                + round(rtf)
                                + " playbackQueue="
                                + playbackQueue.size()
                );

            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                return;

            } catch (Exception error) {
                Log.e(
                        TAG,
                        "GENERATE_ERROR",
                        error
                );
            }
        }
    }

    
    private void playbackLoop() {
        boolean hasPlayedChunk = false;
        Process.setThreadPriority(
                Process.THREAD_PRIORITY_AUDIO
        );

        while (running.get()) {
            try {
                AudioChunk chunk =
                        playbackQueue.poll(
                                500,
                                TimeUnit.MILLISECONDS
                        );

                if (chunk == null) {
                    continue;
                }

                AudioTrack track = audioTrack;

                if (track == null) {
                    Log.w(
                            TAG,
                            "AUDIO_TRACK_NOT_READY"
                    );
                    continue;
                }

                long playbackStartNs =
                        System.nanoTime();

                double generatedToPlaybackMs =
                        nanosToMilliseconds(
                                playbackStartNs
                                        - chunk.generatedAtNs
                        );

                if (track.getPlayState()
                        != AudioTrack.PLAYSTATE_PLAYING) {
                    track.play();
                }

                Log.d(
                        TAG,
                        "TIMING_PLAY_START id="
                                + chunk.id
                                + " generatedToPlaybackMs="
                                + round(
                                        generatedToPlaybackMs
                                )
                                + " remainingQueue="
                                + playbackQueue.size()
                );
if (hasPlayedChunk) {
    double pauseSeconds =
            Math.round(
                    ThreadLocalRandom.current().nextDouble(0.0, 1.0)
                            * 0.5
                            * 100.0
            ) / 100.0;

    int pauseSamples =
            (int) Math.round(
                    pauseSeconds * chunk.sampleRate
            );

    if (pauseSamples > 0) {
        short[] silence = new short[pauseSamples];

        track.write(
                silence,
                0,
                silence.length,
                AudioTrack.WRITE_BLOCKING
        );
    }
}
hasPlayedChunk = true;
                int written =
                        track.write(
                                chunk.samples,
                                0,
                                chunk.samples.length,
                                AudioTrack.WRITE_BLOCKING
                        );

                long playbackEndNs =
                        System.nanoTime();

                double writeMs =
                        nanosToMilliseconds(
                                playbackEndNs
                                        - playbackStartNs
                        );

                if (written < 0) {
                    Log.e(
                            TAG,
                            "AUDIO_WRITE_ERROR code="
                                    + written
                    );
                }

                Log.d(
                        TAG,
                        "TIMING_PLAY_END id="
                                + chunk.id
                                + " writeMs="
                                + round(writeMs)
                                + " samples="
                                + chunk.samples.length
                                + " remainingQueue="
                                + playbackQueue.size()
                );

            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                return;

            } catch (Exception error) {
                Log.e(
                        TAG,
                        "PLAYBACK_ERROR",
                        error
                );
            }
        }
    }

   private static short[] convertToPcm16(
        float[] samples,
        float volume
){
        short[] pcm =
                new short[samples.length];

        for (int index = 0;
             index < samples.length;
             index++) {

           float value =
        samples[index] * volume;

value = Math.max(
        -1.0f,
        Math.min(
                1.0f,
                value
        )
);

            pcm[index] =
                    (short) (
                            value * Short.MAX_VALUE
                    );
        }

        return pcm;
    }

    public void destroy() {
        running.set(false);
        ready.set(false);

        generationQueue.clear();
        playbackQueue.clear();

        if (generationThread != null) {
            generationThread.interrupt();
        }

        if (playbackThread != null) {
            playbackThread.interrupt();
        }

        AudioTrack track = audioTrack;

        if (track != null) {
            try {
                track.stop();
            } catch (Exception ignored) {
            }

            track.release();
            audioTrack = null;
        }

       OfflineTts ryanEngine = ryanTts;
OfflineTts femaleEngine = femaleTts;

if (ryanEngine != null) {
    ryanEngine.release();
    ryanTts = null;
}

if (femaleEngine != null) {
    femaleEngine.release();
    femaleTts = null;
}

        Log.i(TAG, "TTS_DESTROYED");
    }

    private static int countWords(String text) {
        String value = text.trim();

        if (value.isEmpty()) {
            return 0;
        }

        return value.split("\\s+").length;
    }

    private static double nanosToMilliseconds(
            long nanos
    ) {
        return nanos / 1_000_000.0;
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

  private static final class TtsJob {
    final String text;
    final String id;
    final String voiceId;
    final long enqueueTime;
    final float speechRate;
    final float speechPitch;
    final float speechVolume;

    TtsJob(
            String text,
            String id,
            String voiceId,
            long enqueueTime,
            float speechRate,
            float speechPitch,
            float speechVolume
    ) {
        this.text = text;
        this.id = id;
        this.voiceId = voiceId;
        this.enqueueTime = enqueueTime;
        this.speechRate = speechRate;
        this.speechPitch = speechPitch;
        this.speechVolume = speechVolume;
    }
}
    private static final class AudioChunk {
        final String id;
        final short[] samples;
        final int sampleRate;
        final double generationMs;
        final double audioMs;
        final double rtf;
        final long generatedAtNs;

        AudioChunk(
                String id,
                short[] samples,
                int sampleRate,
                double generationMs,
                double audioMs,
                double rtf,
                long generatedAtNs
        ) {
            this.id = id;
            this.samples = samples;
            this.sampleRate = sampleRate;
            this.generationMs = generationMs;
            this.audioMs = audioMs;
            this.rtf = rtf;
            this.generatedAtNs = generatedAtNs;
        }
    }
}