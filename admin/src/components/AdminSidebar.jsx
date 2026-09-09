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
      <h2>Skillzage Admin</h2>

      <nav>
        <NavLink to="/admin">Dashboard</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/interviews">Interviews</NavLink>
        <NavLink to="/admin/questions">Questions</NavLink>
        <NavLink to="/admin/settings">Settings</NavLink>
      </nav>

      <button onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
}