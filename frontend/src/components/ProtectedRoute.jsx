import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" />;

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
