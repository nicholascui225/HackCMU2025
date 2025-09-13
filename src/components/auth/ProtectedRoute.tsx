import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return children; // or a loading spinner
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};


