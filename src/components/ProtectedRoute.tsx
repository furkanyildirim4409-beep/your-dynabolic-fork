import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DynabolicLoader from "@/components/DynabolicLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

const ProtectedRoute = ({ children, skipOnboardingCheck }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><DynabolicLoader /></div>;
  if (!user) return <Navigate to="/login" replace />;

  // Onboarding guard: athletes who haven't completed onboarding
  if (
    !skipOnboardingCheck &&
    profile &&
    profile.role === "athlete" &&
    !profile.onboarding_completed &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
