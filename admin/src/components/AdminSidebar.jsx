import { NavLink, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../services/authService";

export default function AdminSidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  return (
    <aside className="admin-sidebar">
      <h2>SkillzageAI Admin</h2>

      <nav>
        <NavLink to="/admin" end><span className="admin-nav-icon" aria-hidden="true">⌂</span>Dashboard</NavLink>
        <NavLink to="/admin/users"><span className="admin-nav-icon" aria-hidden="true">♙</span>Users</NavLink>
        <NavLink to="/admin/interviews"><span className="admin-nav-icon" aria-hidden="true">▤</span>Interviews</NavLink>
        <NavLink to="/admin/questions"><span className="admin-nav-icon" aria-hidden="true">☷</span>Questions</NavLink>
        <NavLink to="/admin/settings"><span className="admin-nav-icon" aria-hidden="true">⚙</span>Settings</NavLink>
      </nav>

      <button onClick={handleLogout}>
        <span className="admin-nav-icon" aria-hidden="true">↪</span>Logout
      </button>
    </aside>
  );
}
