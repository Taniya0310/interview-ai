import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  History,
  Home,
  Mic,
  Settings,
  GraduationCap
} from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="app-bottom-nav">
      <div className="app-bottom-nav-inner">
        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/dashboard") ? "active" : ""
          }`}
          onClick={() => navigate("/dashboard")}
        >
          <span className="bottom-nav-icon">
            <Home size={19} strokeWidth={1.9} />
          </span>

          <span className="bottom-nav-label">
            Home
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/interview/history")
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/interview/history")
          }
        >
          <span className="bottom-nav-icon">
            <History size={19} strokeWidth={1.9} />
          </span>

          <span className="bottom-nav-label">
            History
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/training/setup")
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/training/setup")
          }
        >
          <span className="bottom-nav-icon">
            <GraduationCap
              size={19}
              strokeWidth={1.9}
            />
          </span>

          <span className="bottom-nav-label">
            Training
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/interview/setup")
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/interview/setup")
          }
        >
          <span className="bottom-nav-icon">
            <Mic size={19} strokeWidth={1.9} />
          </span>

          <span className="bottom-nav-label">
            Interview
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/settings") ? "active" : ""
          }`}
          onClick={() => navigate("/settings")}
        >
          <span className="bottom-nav-icon">
            <Settings
              size={19}
              strokeWidth={1.9}
            />
          </span>

          <span className="bottom-nav-label">
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
}