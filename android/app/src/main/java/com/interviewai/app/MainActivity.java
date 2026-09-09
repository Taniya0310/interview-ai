package com.interviewai.app;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.Manifest;
import android.app.AlertDialog;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import android.widget.ImageView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.Intent;
import android.net.Uri;
import java.io.FileInputStream;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "OfflineTTS";
    private static final int MEDIA_PERMISSION_REQUEST = 1001;

    private PermissionRequest pendingPermissionRequest;
    private AlertDialog downloadDialog;
    private OfflineTtsManager offlineTtsManager;
    private Handler statusHandler;
    private long lastBackPressedTime = 0;
private ProgressBar downloadProgress;
private TextView dialogStatus;
private TextView progressText;
private ImageView successTick;
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        WebSettings webSettings = webView.getSettings();
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        webView.addJavascriptInterface(
                new TtsBridge(),
                "AndroidTTS"
        );

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(
                    PermissionRequest request
            ) {
                runOnUiThread(() -> {
                    boolean cameraAllowed =
                            ContextCompat.checkSelfPermission(
                                    MainActivity.this,
                                    Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED;

                    boolean microphoneAllowed =
                            ContextCompat.checkSelfPermission(
                                    MainActivity.this,
                                    Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED;

                    if (cameraAllowed && microphoneAllowed) {
                        request.grant(request.getResources());
                        return;
                    }

                    pendingPermissionRequest = request;

                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{
                                    Manifest.permission.CAMERA,
                                    Manifest.permission.RECORD_AUDIO
                            },
                            MEDIA_PERMISSION_REQUEST
                    );
                });
            }
        });

        statusHandler = new Handler(Looper.getMainLooper());

        offlineTtsManager =
        new OfflineTtsManager(this);
    }
private void showCheckingState() {
    runOnUiThread(() -> {
        if (dialogStatus != null) {
            dialogStatus.setText("Checking assets...");
        }

        if (progressText != null) {
            progressText.setVisibility(View.GONE);
        }

        if (downloadProgress != null) {
            downloadProgress.setIndeterminate(true);
        }

        if (successTick != null) {
            successTick.setVisibility(View.GONE);
        }
    });
}
    private void startOfflineTts() {
        showDownloadDialog();
 showCheckingState();
       offlineTtsManager.initialize(
        new ModelDownloader.DownloadListener() {
            @Override
            public void onStarted() {
                updateDownloadDialog("Downloading Assets...");
            }

           @Override
public void onProgress(int percent) {
    if (downloadProgress != null) {
        downloadProgress.setIndeterminate(false);
    }

    updateDownloadProgress(percent);
}

@Override
public void onExtracting() {
    showSettingUpState();
}

@Override
public void onCompleted() {
    updateDownloadDialog("Checking Assets...");
}

            @Override
            public void onError(Exception error) {
                updateDownloadDialog(
                        "Poor internet connection. Check your network and restart the app."
                );
            }
        }
);

        statusHandler.postDelayed(
                new Runnable() {
                    @Override
                    public void run() {
                        if (offlineTtsManager != null
                                && offlineTtsManager.isReady()) {

                           Log.i(TAG, "TTS_READY");

updateDownloadDialog("Setup completed!");

if (progressText != null) {
    progressText.setText("Asset is ready.");
}

if (downloadProgress != null) {
    downloadProgress.setIndeterminate(false);
    downloadProgress.setVisibility(View.GONE);
}

if (successTick != null) {
    successTick.setVisibility(View.VISIBLE);
}

statusHandler.postDelayed(() -> {
    dismissDownloadDialog();
}, 1200);

return;
                        }

                        

                        statusHandler.postDelayed(
                                this,
                                500
                        );
                    }
                },
                500
        );
    }


private void shareAppApk() {
    try {
        File apkFile = new File(
                getCacheDir(),
                "skillzageai.apk"
        );

        try (
                InputStream input =
                        new FileInputStream(
                                getApplicationInfo().sourceDir
                        );

                OutputStream output =
                        new FileOutputStream(apkFile)
        ) {
            byte[] buffer = new byte[8192];
            int length;

            while ((length = input.read(buffer)) != -1) {
                output.write(buffer, 0, length);
            }
        }

        Uri apkUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                apkFile
        );

        Intent shareIntent = new Intent(Intent.ACTION_SEND);

        shareIntent.setType(
                "application/vnd.android.package-archive"
        );

        shareIntent.putExtra(
                Intent.EXTRA_STREAM,
                apkUri
        );

        shareIntent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION
        );

        startActivity(
                Intent.createChooser(
                        shareIntent,
                        "Share SkillzageAI"
                )
        );

    } catch (Exception error) {
        Log.e(
                TAG,
                "APK_SHARE_FAILED",
                error
        );

        Toast.makeText(
                this,
                "Unable to share the app",
                Toast.LENGTH_LONG
        ).show();
    }
}

private void showDownloadDialog() {
    runOnUiThread(() -> {
        View dialogView = LayoutInflater.from(this)
                .inflate(R.layout.dialog_voice_assets, null);

        dialogStatus = dialogView.findViewById(R.id.dialogStatus);
        downloadProgress = dialogView.findViewById(R.id.downloadProgress);
        progressText = dialogView.findViewById(R.id.progressText);
successTick =
        dialogView.findViewById(R.id.successTick);
        successTick.setVisibility(View.GONE);
        AlertDialog.Builder builder =
                new AlertDialog.Builder(this);

        builder.setView(dialogView);
        builder.setCancelable(false);

        downloadDialog = builder.create();
        downloadDialog.show();

        if (downloadDialog.getWindow() != null) {
            downloadDialog.getWindow()
                    .setBackgroundDrawableResource(
                            android.R.color.transparent
                    );
        }
    });
}

private void updateDownloadProgress(int percent) {
    runOnUiThread(() -> {
        if (downloadProgress != null) {
            downloadProgress.setProgress(percent);
        }

        if (progressText != null) {
            progressText.setText(
                    "Downloading Assets - " + percent + "%"
            );
        }
    });
}
  private void showSettingUpState() {
    runOnUiThread(() -> {
        if (dialogStatus != null) {
            dialogStatus.setText(
                    "Setting up Assets, please wait..."
            );
        }

        if (progressText != null) {
            progressText.setText(
                    "Preparing Assets..."
            );
        }

        if (downloadProgress != null) {
            downloadProgress.setIndeterminate(true);
        }
    });
}
private void updateDownloadDialog(String message) {
    runOnUiThread(() -> {
        if (dialogStatus != null) {
            dialogStatus.setText(message);
        }
    });
}
    private void dismissDownloadDialog() {
        runOnUiThread(() -> {
            if (downloadDialog != null
                    && downloadDialog.isShowing()) {
                downloadDialog.dismiss();
            }
        });
    }

    private class TtsBridge {

        @JavascriptInterface
        public boolean isReady() {
            return offlineTtsManager != null
                    && offlineTtsManager.isReady();
        }

        @JavascriptInterface
public void shareApp() {
    runOnUiThread(() -> shareAppApk());
}

@JavascriptInterface
public void startModelCheck() {
    runOnUiThread(() -> {
        if (
                offlineTtsManager != null &&
                !offlineTtsManager.isReady()
        ) {
            startOfflineTts();
        }
    });
}
        @JavascriptInterface
        public void speakChunk(
                String text,
                String chunkId
        ) {
            Log.d(
                    TAG,
                    "SPEAK_REQUEST id="
                            + chunkId
                            + " words="
                            + countWords(text)
            );

            if (offlineTtsManager == null
                    || !offlineTtsManager.isReady()) {
                Log.w(TAG, "SPEAK_REQUEST_IGNORED_TTS_NOT_READY");
                return;
            }

            offlineTtsManager.enqueue(
                    text,
                    chunkId
            );
        }

        @JavascriptInterface
        public void stop() {
            Log.i(TAG, "TTS_STOP_REQUEST");

            if (offlineTtsManager != null) {
                offlineTtsManager.stop();
            }
        }

        @JavascriptInterface
        public void clearQueue() {
            Log.i(TAG, "TTS_CLEAR_QUEUE_REQUEST");

            if (offlineTtsManager != null) {
                offlineTtsManager.clearQueue();
            }
        }
    }

    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }

        return text.trim().split("\\s+").length;
    }

    @Override
    public void onBackPressed() {
        long currentTime =
                System.currentTimeMillis();

        if (currentTime - lastBackPressedTime < 2000) {
            finishAndRemoveTask();
            return;
        }

        lastBackPressedTime = currentTime;

        Toast.makeText(
                this,
                "Press back again to exit",
                Toast.LENGTH_SHORT
        ).show();
    }

    @Override
    public void onDestroy() {
        if (statusHandler != null) {
            statusHandler.removeCallbacksAndMessages(null);
        }

        dismissDownloadDialog();

        if (offlineTtsManager != null) {
            offlineTtsManager.destroy();
            offlineTtsManager = null;
        }

        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            @NonNull String[] permissions,
            @NonNull int[] grantResults
    ) {
        super.onRequestPermissionsResult(
                requestCode,
                permissions,
                grantResults
        );

        if (requestCode != MEDIA_PERMISSION_REQUEST) {
            return;
        }

        if (pendingPermissionRequest == null) {
            return;
        }

        boolean allGranted = true;

        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (allGranted) {
            pendingPermissionRequest.grant(
                    pendingPermissionRequest.getResources()
            );
        } else {
            pendingPermissionRequest.deny();
        }

        pendingPermissionRequest = null;
    }
}