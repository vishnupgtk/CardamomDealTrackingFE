import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && currentRole !== role) return <Navigate to="/login" replace />;
  return children;
}
