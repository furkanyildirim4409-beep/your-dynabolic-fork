import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DynabolicLoader from "@/components/DynabolicLoader";

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ("coach" | "athlete")[] }) => {
  const { user, profile, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><DynabolicLoader /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role as "coach" | "athlete")) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
