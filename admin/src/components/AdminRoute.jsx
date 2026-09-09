import { Navigate, Outlet } from "react-router-dom";
import { isAdminAuthenticated } from "../services/authService";

export default function AdminRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}