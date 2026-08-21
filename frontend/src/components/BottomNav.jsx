import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  History,
  Home,
  Plus,
  Settings,
} from "lucide-react";

const navItems = [
  {
    label: "Home",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "History",
    path: "/interview/history",
    icon: History,
  },
  {
    label: "Results",
    path: "/interview/results",
    icon: BarChart3,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    if (path === "/interview/history") {
      return location.pathname.startsWith(
        "/interview/history"
      );
    }

    if (path === "/interview/results") {
      return location.pathname.startsWith(
        "/interview/results"
      );
    }

    if (path === "/settings") {
      return location.pathname.startsWith(
        "/settings"
      );
    }

    return false;
  };

  return (
    <nav className="app-bottom-nav">
      <div className="app-bottom-nav-inner">

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/dashboard")
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/dashboard")
          }
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
            <History
              size={19}
              strokeWidth={1.9}
            />
          </span>

          <span className="bottom-nav-label">
            History
          </span>
        </button>

        {/* Center action */}

        <button
          type="button"
          className="bottom-nav-create"
          onClick={() =>
            navigate("/interview/setup")
          }
          aria-label="Start interview"
        >
          <span className="bottom-nav-create-icon">
            <Plus
              size={24}
              strokeWidth={2.1}
            />
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/interview/results")
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/interview/results")
          }
        >
          <span className="bottom-nav-icon">
            <BarChart3
              size={19}
              strokeWidth={1.9}
            />
          </span>

          <span className="bottom-nav-label">
            Results
          </span>
        </button>

        <button
          type="button"
          className={`bottom-nav-item ${
            isActive("/settings")
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("/settings")
          }
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