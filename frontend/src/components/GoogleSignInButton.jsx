export default function GoogleSignInButton() {
  function handleGoogleSignIn() {
    alert("Google Sign-In will be connected later.");
  }

  return (
    <button
      type="button"
      className="google-button"
      onClick={handleGoogleSignIn}
    >
      <span aria-hidden="true">G</span>
      Continue with Google
    </button>
  );
}