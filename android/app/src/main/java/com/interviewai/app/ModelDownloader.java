package com.interviewai.app;

import android.content.Context;
import android.util.Log;

import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public final class ModelDownloader {

    private static final String TAG = "OfflineTTS";

    public static final String RYAN_VOICE_ID = "ryan";
    public static final String FEMALE_VOICE_ID = "female";

    private static final ModelSpec RYAN_MODEL =
            new ModelSpec(
                    RYAN_VOICE_ID,
                    "vits-piper-en_US-ryan-medium",
                    "en_US-ryan-medium.onnx",
                    "https://github.com/k2-fsa/sherpa-onnx/releases/download/"
                            + "tts-models/vits-piper-en_US-ryan-medium.tar.bz2"
            );

    private static final ModelSpec FEMALE_MODEL =
            new ModelSpec(
                    FEMALE_VOICE_ID,
                    "vits-piper-en_US-hfc_female-medium",
                    "en_US-hfc_female-medium.onnx",
                    "https://github.com/k2-fsa/sherpa-onnx/releases/download/"
                            + "tts-models/vits-piper-en_US-hfc_female-medium.tar.bz2"
            );

    private final Context context;

    public interface DownloadListener {
        void onStarted();

        void onProgress(int percent);

        void onExtracting();

        void onCompleted();

        void onError(Exception error);
    }

    public ModelDownloader(Context context) {
        this.context = context.getApplicationContext();
    }

    // Keeps compatibility with the existing Ryan code.
    public File getModelDirectory() {
        return getModelDirectory(RYAN_VOICE_ID);
    }

    public File getModelDirectory(String voiceId) {
        ModelSpec model = getModelSpec(voiceId);

        File modelsDirectory =
                new File(context.getFilesDir(), "models");

        return new File(modelsDirectory, model.folderName);
    }

    // Both models must be ready before TTS is marked ready.
    public boolean isModelReady() {
        return isModelReady(RYAN_VOICE_ID)
                && isModelReady(FEMALE_VOICE_ID);
    }

    public boolean isModelReady(String voiceId) {
        ModelSpec model = getModelSpec(voiceId);
        File modelDirectory = getModelDirectory(voiceId);

        File modelFile =
                new File(modelDirectory, model.onnxFileName);

        File tokensFile =
                new File(modelDirectory, "tokens.txt");

        File espeakDirectory =
                new File(modelDirectory, "espeak-ng-data");

        return modelFile.isFile()
                && tokensFile.isFile()
                && espeakDirectory.isDirectory();
    }

    public File downloadAndExtract()
            throws IOException {
        return downloadAndExtract(null);
    }

    public File downloadAndExtract(
            DownloadListener listener
    ) throws IOException {

        try {
            if (listener != null) {
                listener.onStarted();
            }

            File modelsDirectory =
                    new File(
                            context.getFilesDir(),
                            "models"
                    );

            if (!modelsDirectory.exists()
                    && !modelsDirectory.mkdirs()) {
                throw new IOException(
                        "Unable to create models directory"
                );
            }

            downloadModel(
                    RYAN_MODEL,
                    0,
                    listener
            );

            downloadModel(
                    FEMALE_MODEL,
                    50,
                    listener
            );

            if (listener != null) {
                listener.onExtracting();
            }

            if (!isModelReady(RYAN_VOICE_ID)
                    || !isModelReady(FEMALE_VOICE_ID)) {
                throw new IOException(
                        "Required voice model files are missing"
                );
            }

            Log.i(TAG, "ALL_MODEL_FILES_VALID");

            if (listener != null) {
                listener.onCompleted();
            }

            // Existing OfflineTtsManager expects the Ryan directory.
            return getModelDirectory(RYAN_VOICE_ID);

        } catch (IOException error) {
            Log.e(TAG, "MODEL_ERROR", error);

            if (listener != null) {
                listener.onError(error);
            }

            throw error;
        }
    }

    private void downloadModel(
            ModelSpec model,
            int progressOffset,
            DownloadListener listener
    ) throws IOException {

        if (isModelReady(model.voiceId)) {
            Log.i(
                    TAG,
                    "MODEL_ALREADY_EXISTS voice="
                            + model.voiceId
            );

            if (listener != null) {
                listener.onProgress(
                        progressOffset + 50
                );
            }

            return;
        }

        File modelsDirectory =
                new File(
                        context.getFilesDir(),
                        "models"
                );

        File archive =
                new File(
                        context.getFilesDir(),
                        model.folderName + ".tar.bz2"
                );

        Log.i(
                TAG,
                "MODEL_DOWNLOAD_START voice="
                        + model.voiceId
        );

        downloadArchive(
                model,
                archive,
                progressOffset,
                listener
        );

        deleteRecursively(
                getModelDirectory(model.voiceId)
        );

        extractArchive(
                archive,
                modelsDirectory
        );

        if (!isModelReady(model.voiceId)) {
            throw new IOException(
                    "Required files are missing for voice: "
                            + model.voiceId
            );
        }

        if (!archive.delete()) {
            Log.w(
                    TAG,
                    "MODEL_ARCHIVE_DELETE_FAILED voice="
                            + model.voiceId
            );
        }

        Log.i(
                TAG,
                "MODEL_READY voice="
                        + model.voiceId
        );
    }

    private void downloadArchive(
            ModelSpec model,
            File destination,
            int progressOffset,
            DownloadListener listener
    ) throws IOException {

        HttpURLConnection connection =
                (HttpURLConnection)
                        new URL(model.url).openConnection();

        connection.setConnectTimeout(20_000);
        connection.setReadTimeout(120_000);
        connection.setInstanceFollowRedirects(true);

        try {
            connection.connect();

            int responseCode =
                    connection.getResponseCode();

            if (responseCode < 200
                    || responseCode >= 300) {
                throw new IOException(
                        "Download failed for "
                                + model.voiceId
                                + ". HTTP status: "
                                + responseCode
                );
            }

            long totalBytes =
                    connection.getContentLengthLong();

            long downloadedBytes = 0;
            int lastReportedPercent = -1;

            byte[] buffer =
                    new byte[64 * 1024];

            try (
                    InputStream input =
                            new BufferedInputStream(
                                    connection.getInputStream()
                            );

                    OutputStream output =
                            new BufferedOutputStream(
                                    new FileOutputStream(
                                            destination
                                    )
                            )
            ) {
                int bytesRead;

                while ((bytesRead =
                        input.read(buffer)) != -1) {

                    output.write(
                            buffer,
                            0,
                            bytesRead
                    );

                    downloadedBytes += bytesRead;

                    if (totalBytes > 0) {
                        int modelPercent =
                                (int) (
                                        downloadedBytes
                                                * 100
                                                / totalBytes
                                );

                        if (modelPercent
                                != lastReportedPercent) {

                            lastReportedPercent =
                                    modelPercent;

                            int overallPercent =
                                    progressOffset
                                            + (
                                                    modelPercent
                                                            / 2
                                            );

                            Log.i(
                                    TAG,
                                    "MODEL_DOWNLOAD_PROGRESS voice="
                                            + model.voiceId
                                            + " percent="
                                            + modelPercent
                            );

                            if (listener != null) {
                                listener.onProgress(
                                        overallPercent
                                );
                            }
                        }
                    }
                }
            }

        } finally {
            connection.disconnect();
        }
    }

    private void extractArchive(
            File archive,
            File outputDirectory
    ) throws IOException {

        try (
                InputStream fileInput =
                        new BufferedInputStream(
                                new FileInputStream(archive)
                        );

                BZip2CompressorInputStream bz2Input =
                        new BZip2CompressorInputStream(
                                fileInput
                        );

                TarArchiveInputStream tarInput =
                        new TarArchiveInputStream(
                                bz2Input
                        )
        ) {
            TarArchiveEntry entry;

            byte[] buffer =
                    new byte[64 * 1024];

            while ((entry =
                    tarInput.getNextTarEntry())
                    != null) {

                File outputFile =
                        getSafeOutputFile(
                                outputDirectory,
                                entry.getName()
                        );

                if (entry.isDirectory()) {
                    if (!outputFile.exists()
                            && !outputFile.mkdirs()) {
                        throw new IOException(
                                "Unable to create directory: "
                                        + outputFile
                        );
                    }

                    continue;
                }

                File parent =
                        outputFile.getParentFile();

                if (parent != null
                        && !parent.exists()
                        && !parent.mkdirs()) {
                    throw new IOException(
                            "Unable to create directory: "
                                    + parent
                    );
                }

                try (
                        OutputStream output =
                                new BufferedOutputStream(
                                        new FileOutputStream(
                                                outputFile
                                        )
                                )
                ) {
                    int bytesRead;

                    while ((bytesRead =
                            tarInput.read(buffer))
                            != -1) {

                        output.write(
                                buffer,
                                0,
                                bytesRead
                        );
                    }
                }
            }
        }
    }

    private File getSafeOutputFile(
            File rootDirectory,
            String archivePath
    ) throws IOException {

        String safePath =
                archivePath.replace('\\', '/');

        File outputFile =
                new File(
                        rootDirectory,
                        safePath
                );

        String rootPath =
                rootDirectory.getCanonicalPath()
                        + File.separator;

        String outputPath =
                outputFile.getCanonicalPath();

        if (!outputPath.startsWith(rootPath)) {
            throw new IOException(
                    "Unsafe archive path: "
                            + archivePath
            );
        }

        return outputFile;
    }

    private ModelSpec getModelSpec(String voiceId) {
        if (FEMALE_VOICE_ID.equalsIgnoreCase(voiceId)) {
            return FEMALE_MODEL;
        }

        return RYAN_MODEL;
    }

    private static void deleteRecursively(File file) {
        if (!file.exists()) {
            return;
        }

        if (file.isDirectory()) {
            File[] children = file.listFiles();

            if (children != null) {
                for (File child : children) {
                    deleteRecursively(child);
                }
            }
        }

        if (!file.delete()) {
            Log.w(
                    TAG,
                    "Could not delete "
                            + file.getAbsolutePath()
            );
        }
    }

    private static final class ModelSpec {
        final String voiceId;
        final String folderName;
        final String onnxFileName;
        final String url;

        ModelSpec(
                String voiceId,
                String folderName,
                String onnxFileName,
                String url
        ) {
            this.voiceId = voiceId;
            this.folderName = folderName;
            this.onnxFileName = onnxFileName;
            this.url = url;
        }
    }
}