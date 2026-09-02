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

    private static final String MODEL_FOLDER =
            "vits-piper-en_US-ryan-medium";

    private static final String MODEL_URL =
            "https://github.com/k2-fsa/sherpa-onnx/releases/download/"
                    + "tts-models/vits-piper-en_US-ryan-medium.tar.bz2";

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

    public File getModelDirectory() {
        File modelsDirectory =
                new File(context.getFilesDir(), "models");

        return new File(modelsDirectory, MODEL_FOLDER);
    }

    public boolean isModelReady() {
        File modelDirectory = getModelDirectory();

        File modelFile =
                new File(
                        modelDirectory,
                        "en_US-ryan-medium.onnx"
                );

        File tokensFile =
                new File(
                        modelDirectory,
                        "tokens.txt"
                );

        File espeakDirectory =
                new File(
                        modelDirectory,
                        "espeak-ng-data"
                );

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

        if (isModelReady()) {
            Log.i(TAG, "MODEL_ALREADY_EXISTS");

            if (listener != null) {
                listener.onCompleted();
            }

            return getModelDirectory();
        }

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

            File archive = new File(
                    context.getFilesDir(),
                    MODEL_FOLDER + ".tar.bz2"
            );

            Log.i(TAG, "MODEL_DOWNLOAD_START");

            downloadArchive(
                    archive,
                    listener
            );

            Log.i(
                    TAG,
                    "MODEL_DOWNLOAD_COMPLETE bytes="
                            + archive.length()
            );

            deleteRecursively(
                    getModelDirectory()
            );

            Log.i(
                    TAG,
                    "MODEL_EXTRACTION_START"
            );
if (listener != null) {
    listener.onExtracting();
}
            extractArchive(
                    archive,
                    modelsDirectory
            );

            Log.i(
                    TAG,
                    "MODEL_EXTRACTION_COMPLETE"
            );

            if (!isModelReady()) {
                throw new IOException(
                        "Required model files are missing"
                );
            }

            if (!archive.delete()) {
                Log.w(
                        TAG,
                        "MODEL_ARCHIVE_DELETE_FAILED"
                );
            }

            Log.i(TAG, "MODEL_FILES_VALID");

            if (listener != null) {
                listener.onCompleted();
            }

            return getModelDirectory();

        } catch (IOException error) {
            Log.e(
                    TAG,
                    "MODEL_ERROR",
                    error
            );

            if (listener != null) {
                listener.onError(error);
            }

            throw error;
        }
    }

    private void downloadArchive(
            File destination,
            DownloadListener listener
    ) throws IOException {

        HttpURLConnection connection =
                (HttpURLConnection)
                        new URL(MODEL_URL)
                                .openConnection();

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
                        "Download failed. HTTP status: "
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
                        int percent =
                                (int) (
                                        downloadedBytes
                                                * 100
                                                / totalBytes
                                );

                        if (percent != lastReportedPercent) {
                            lastReportedPercent =
                                    percent;

                            Log.i(
                                    TAG,
                                    "MODEL_DOWNLOAD_PROGRESS "
                                            + percent
                                            + "%"
                            );

                            if (listener != null) {
                                listener.onProgress(
                                        percent
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
                                new FileInputStream(
                                        archive
                                )
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
                archivePath.replace(
                        '\\',
                        '/'
                );

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

    private static void deleteRecursively(
            File file
    ) {
        if (!file.exists()) {
            return;
        }

        if (file.isDirectory()) {
            File[] children =
                    file.listFiles();

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
}