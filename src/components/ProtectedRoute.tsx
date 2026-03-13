import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DynabolicLoader from "@/components/DynabolicLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><DynabolicLoader /></div>;
  if (!user) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
