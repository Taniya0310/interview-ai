package com.interviewai.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity implements TextToSpeech.OnInitListener {

    private static final int MEDIA_PERMISSION_REQUEST = 1001;
    private PermissionRequest pendingPermissionRequest;
    private TextToSpeech textToSpeech;
    private boolean ttsReady;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();

        textToSpeech = new TextToSpeech(this, this);
        webView.addJavascriptInterface(new TtsBridge(), "AndroidTTS");

        WebSettings webSettings = webView.getSettings();
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

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
    }

    @Override
    public void onInit(int status) {
        ttsReady = status == TextToSpeech.SUCCESS;
        if (ttsReady) {
            textToSpeech.setLanguage(java.util.Locale.forLanguageTag("en-IN"));
            textToSpeech.setSpeechRate(0.9f);
            textToSpeech.setPitch(0.8f);
        }
    }

    private class TtsBridge {
        @JavascriptInterface
        public void speak(String text) {
            runOnUiThread(() -> {
                if (ttsReady && textToSpeech != null) textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "interview-question");
            });
        }
        @JavascriptInterface
        public void stop() {
            runOnUiThread(() -> { if (textToSpeech != null) textToSpeech.stop(); });
        }
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) { textToSpeech.stop(); textToSpeech.shutdown(); }
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



