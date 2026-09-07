# Interview AI

Interview AI is a React-based interview and voice-training platform packaged as an Android application with Capacitor. It provides interview practice, voice training, microphone recording, offline text-to-speech, answer submission, analysis, profiles, and authentication.

## Architecture

The project has three cooperating layers:

```text
React frontend/PWA
        │
        │ HTTP API and JavaScript bridge
        ▼
Capacitor Android WebView ── Native Android bridge
        │                         │
        ▼                         ▼
Node/Express backend       Offline Piper/Sherpa TTS
        │
        ▼
PostgreSQL database and external AI services
```

### React frontend

The frontend contains the web UI and PWA routes. It handles:

- Login and signup screens
- Interview setup and live interview screens
- Voice training setup and recording
- Profile and settings pages
- Interview history and result pages
- Auth token storage and authenticated API requests

Important frontend locations:

```text
frontend/src/App.jsx                         Application routes
frontend/src/context/AuthContext.jsx         Login state and tokens
frontend/src/services/authApi.js             Authenticated API requests
frontend/src/pages/LiveInterviewPage.jsx     Live interview recording/TTS
frontend/src/pages/TrainingPage.jsx          Voice training recording/TTS
frontend/src/pages/GoogleCallbackPage.jsx    Google OAuth callback
frontend/src/services/ttsChunker.js          TTS text chunking
frontend/src/main.jsx                        PWA/service-worker startup
```

### Backend

The backend is a Node.js/Express API. It handles authentication, interviews, training sessions, file uploads, analysis, profiles, and database access.

Important backend locations:

```text
backend/src/app.js                         Express application and routes
backend/src/server.js                       Server startup
backend/src/config/env.js                   Environment configuration
backend/src/routes/                         API route definitions
backend/src/controllers/                    Request handlers
backend/src/services/                       Business logic
backend/src/models/                         Database access
backend/src/middleware/authMiddleware.js   Bearer-token authentication
backend/src/services/geminiService.js       AI analysis integration
```

### Android/Capacitor layer

The Android project packages the React build inside a WebView and exposes native functionality to JavaScript.

```text
android/app/src/main/java/com/interviewai/app/MainActivity.java
android/app/src/main/java/com/interviewai/app/OfflineTtsManager.java
android/app/src/main/java/com/interviewai/app/ModelDownloader.java
android/app/src/main/res/layout/dialog_voice_assets.xml
capacitor.config.json
```

The native bridge is accessed from React through methods such as:

```js
window.AndroidTTS.startModelCheck();
window.AndroidTTS.speakChunk(text, chunkId);
window.AndroidTTS.stop();
window.AndroidTTS.clearQueue();
```

The exact method signatures should be kept consistent between the React code and `MainActivity.java`.

## Requirements

- Node.js and npm
- PostgreSQL
- Android Studio for Android builds
- Android SDK and an emulator or physical device
- Java/JDK supported by the Android Gradle configuration
- Capacitor CLI available through the project dependencies or `npx`
- Required API credentials for the configured AI and email services

## Project setup

Clone the repository and install dependencies in both application folders:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create the database configured for the backend and run the project's database schema or migrations. The backend database connection is configured through environment variables; never commit credentials.

## Environment configuration

Create environment files locally. Do not commit real secrets.

Typical backend values include:

```env
PORT=8000
DATABASE_URL=postgres://user:password@localhost:5432/interviewai
GEMINI_API_KEY=your_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

The exact supported names are defined in `backend/src/config/env.js`. Use that file as the source of truth.

The frontend needs the backend API URL, for example:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Use the production API URL in the production frontend build. Never put private API keys, database passwords, or Google client secrets in `frontend/.env`.

## Running locally

Start the backend from the backend directory:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend URL printed by Vite, usually:

```text
http://localhost:5173
```

The backend health endpoint is exposed by the Express application. Use the route configured in `backend/src/app.js` to verify that the API is running.

## Authentication

### Email authentication

The email flow uses OTP verification:

```text
Request OTP → Verify OTP → Backend creates tokens → Frontend stores auth state
```

The frontend stores the authentication object in `localStorage` under `authData`. Authenticated requests send:

```http
Authorization: Bearer <access-token>
```

### Google authentication

The backend already contains Google OAuth routes:

```text
GET /api/auth/google
GET /api/auth/google/callback
```

For the web/PWA flow:

1. The user selects **Continue with Google**.
2. The browser opens the backend Google route.
3. Google authenticates the user.
4. Google redirects to the backend callback.
5. The backend verifies the account.
6. The backend finds or creates the user in the `users` table.
7. The backend redirects to the frontend `/google-callback` route.
8. The frontend saves the returned application session and redirects to the dashboard.

Google users should be identified with a unique `google_id`. Existing users should be matched by email before creating a duplicate account. The Google client secret must remain on the backend.

For the Android app, prefer native Google Sign-In or a browser-based Capacitor OAuth flow. Do not embed a Google login page directly in the WebView. Configure Android OAuth credentials using the application package name and signing certificate SHA-1.

## Interview flow

The normal interview flow is:

```text
Interview setup
    ↓
Device/microphone check
    ↓
Live interview
    ↓
Video/audio recording
    ↓
Answer upload
    ↓
Processing and analysis
    ↓
Results and history
```

The live interview page can use native Android TTS when available and browser speech synthesis as a fallback. It records the answer and submits it to the backend.

## Voice training flow

The training flow is voice-only:

```text
Training setup
    ↓
Microphone check
    ↓
Training question is spoken aloud
    ↓
Audio recording
    ↓
Training answer upload
    ↓
Next question or completion
```

Training uses the same native TTS bridge as the interview when the app is running on Android. In a browser, it can fall back to browser speech synthesis.

## Offline voice model

The Android app downloads the Piper/Sherpa voice model when it is not already available. The download is implemented in:

```text
android/app/src/main/java/com/interviewai/app/ModelDownloader.java
```

The current model archive is downloaded from the configured model URL and extracted into the app's private files directory. `MainActivity.java` displays progress and errors.

For production reliability, host the model archive on your own HTTPS storage or CDN and update `MODEL_URL` in `ModelDownloader.java`. Keep the archive structure unchanged, use a stable URL, and verify the downloaded file with a SHA-256 checksum before extraction.

The app should show a useful message when the download fails, for example:

```text
Poor internet connection. Check your network and restart the app.
```

## Building the PWA

From the frontend directory:

```bash
npm run build
```

The generated production files are normally placed in the frontend build directory configured by Vite.

## Building the Android app

Build the frontend first, then synchronize Capacitor:

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync to finish.
2. Select an emulator or connected Android device.
3. Run the app.
4. For release distribution, configure signing credentials and build a signed APK or AAB.

Whenever frontend code changes, rebuild the frontend and run:

```bash
npx cap copy android
```

Run `npx cap sync android` when native plugins, Android configuration, or dependencies change.

## Capacitor bridge development

When adding a native feature:

1. Add a JavaScript call in the React service or component.
2. Add the matching `@JavascriptInterface` method in the Android layer.
3. Validate input before using it natively.
4. Return errors in a predictable format.
5. Add required Android permissions to `AndroidManifest.xml`.
6. Test both Android and browser fallback behavior.
7. Rebuild and synchronize Capacitor.

Do not assume that `window.AndroidTTS` exists in a normal browser. Always guard native calls:

```js
if (window.AndroidTTS?.speakChunk) {
  window.AndroidTTS.speakChunk(text, chunkId);
} else {
  // Browser TTS fallback
}
```

## Data ownership and security

Every authenticated request must be associated with the authenticated backend user. Interview sessions, training sessions, answers, profiles, and reports should be queried using the authenticated user ID rather than an ID supplied blindly by the client.

Security rules:

- Never commit `.env` files containing secrets.
- Never put Google client secrets in the frontend or APK.
- Verify Google tokens on the backend.
- Use HTTPS in production.
- Validate uploaded audio and video files.
- Use parameterized SQL queries.
- Keep access tokens short-lived and rotate refresh tokens where supported.
- Do not log passwords, tokens, or private user data.
- Use secure HTTP-only cookies for production auth if possible instead of putting tokens in URL query parameters.

## Troubleshooting

### Frontend cannot reach the backend

- Check `VITE_API_BASE_URL`.
- Confirm the backend is running.
- Confirm CORS configuration.
- On a physical Android device, do not use `localhost` for a backend running on your computer; use the computer's LAN IP or a reachable HTTPS development URL.

### Microphone does not work

- Check browser or Android microphone permission.
- Use HTTPS in browsers except for permitted local development origins.
- Confirm the device has a microphone.
- Check that recording is stopped before submitting.

### Native TTS does not work

- Confirm the model download completed.
- Check Android logs for `MODEL_ERROR` or `TTS_INITIALIZATION_ERROR`.
- Confirm the expected model files exist.
- Confirm the React bridge method names match `MainActivity.java`.
- Test browser speech synthesis as a fallback.

### Google login fails

- Confirm the redirect URI exactly matches Google Cloud Console.
- Confirm the backend `GOOGLE_CLIENT_ID`, secret, and redirect URI are correct.
- Confirm the frontend callback route exists.
- Confirm the backend verifies the Google identity before issuing app tokens.
- For Android, verify the package name and signing certificate SHA-1.

## Suggested repository documentation

When sharing this project with another developer, include:

- This README
- A safe `.env.example` for frontend and backend
- Database schema or migration instructions
- API endpoint documentation
- Android package name and build instructions
- Native bridge method documentation
- Google OAuth setup instructions
- Model hosting and checksum instructions

Never share production secrets in the repository or README.
