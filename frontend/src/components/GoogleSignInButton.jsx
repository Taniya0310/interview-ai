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
        <span aria-hidden="true">G</span>
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