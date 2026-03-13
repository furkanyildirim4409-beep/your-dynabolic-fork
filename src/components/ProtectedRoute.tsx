import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DynabolicLoader from "@/components/DynabolicLoader";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><DynabolicLoader /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
