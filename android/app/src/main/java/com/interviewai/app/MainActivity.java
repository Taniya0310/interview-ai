package com.interviewai.app;

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

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "OfflineTTS";
    private static final int MEDIA_PERMISSION_REQUEST = 1001;

    private PermissionRequest pendingPermissionRequest;
    private AlertDialog downloadDialog;
    private OfflineTtsManager offlineTtsManager;
    private Handler statusHandler;
    private long lastBackPressedTime = 0;

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

        startOfflineTts();
    }

    private void startOfflineTts() {
        showDownloadDialog();

        offlineTtsManager.initialize();

        statusHandler.postDelayed(
                new Runnable() {
                    @Override
                    public void run() {
                        if (offlineTtsManager != null
                                && offlineTtsManager.isReady()) {

                            Log.i(TAG, "TTS_READY");

                            updateDownloadDialog(
                                    "Voice assets ready"
                            );

                            statusHandler.postDelayed(() -> {
                                dismissDownloadDialog();
                            }, 700);

                            return;
                        }

                        if (downloadDialog != null
                                && downloadDialog.isShowing()) {
                            updateDownloadDialog(
                                    "Downloading voice assets..."
                            );
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

    private void showDownloadDialog() {
        runOnUiThread(() -> {
            AlertDialog.Builder builder =
                    new AlertDialog.Builder(this);

            builder.setTitle("Please wait");

            builder.setMessage(
                    "Downloading voice assets..."
            );

            builder.setCancelable(false);

            downloadDialog = builder.create();
            downloadDialog.show();
        });
    }

    private void updateDownloadDialog(
            String message
    ) {
        runOnUiThread(() -> {
            if (downloadDialog != null
                    && downloadDialog.isShowing()) {
                downloadDialog.setMessage(message);
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