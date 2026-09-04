const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

export default function GoogleSignInButton() {
  function handleGoogleSignIn() {
    window.location.href =
      `${API_BASE_URL}/auth/google`;
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