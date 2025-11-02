import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/hooks/useAuth";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const auth = isAuthenticated();

  if (!auth) return <Navigate to="/login" replace />;

  return children;
}