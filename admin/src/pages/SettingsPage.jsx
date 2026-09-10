import { useNavigate } from "react-router-dom";
import {
  getAdminUser,
  logoutAdmin,
} from "../services/authService";

export default function SettingsPage() {
  const navigate = useNavigate();
  const admin = getAdminUser();

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>Administration</p>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="admin-card">
        <h2>Admin profile</h2>

        <p>
          <strong>Email:</strong>{" "}
          {admin?.email || "—"}
        </p>

        <p>
          <strong>Name:</strong>{" "}
          {admin?.name || "Administrator"}
        </p>

        <p>
          <strong>Role:</strong> Administrator
        </p>

        <button
          type="button"
          className="admin-primary-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </section>
  );
}