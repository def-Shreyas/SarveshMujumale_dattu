import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_ROUTES = ["/login", "/reset-password"];

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // ✅ Allow public routes
  if (PUBLIC_ROUTES.some((path) => location.pathname.startsWith(path))) {
    return <Outlet />;
  }

  // 🔒 Block others
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
