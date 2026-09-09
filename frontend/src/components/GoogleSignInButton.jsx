import { useState } from "react";

export default function GoogleSignInButton() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        type="button"
        className="google-button"
        onClick={() => setShowDialog(true)}
      >
        <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
          <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z" />
          <path fill="#FBBC05" d="M6.54 13.78a5.86 5.86 0 0 1 0-3.56V7.69H3.3a9.73 9.73 0 0 0 0 8.62l3.24-2.53Z" />
          <path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.28 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.91 9.46 6.19 12 6.19Z" />
        </svg>
        Continue with Google
      </button>

      {showDialog && (
        <div
          className="google-dialog-backdrop"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="google-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="google-dialog-icon">G</div>

            <h2 id="google-dialog-title">
              Google sign-in is coming soon
            </h2>

            <p>
              This feature will be available soon.
              Please continue with email for now.
            </p>

            <button
              type="button"
              className="google-dialog-button"
              onClick={() => setShowDialog(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
