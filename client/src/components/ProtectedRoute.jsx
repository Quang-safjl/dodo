import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Keep admin/manager POS inside dashboard layout (with sidebar)
  if ((user?.role === "ADMIN" || user?.role === "MANAGER") && location.pathname === "/pos") {
    return <Navigate to="/dashboard/pos" replace />;
  }
  if (roles?.length && !roles.includes(user?.role)) return <Navigate to="/pos" replace />;
  return children;
}

