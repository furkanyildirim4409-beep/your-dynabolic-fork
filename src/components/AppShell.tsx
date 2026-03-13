import { ReactNode } from "react";
import { motion } from "framer-motion";
import EliteDock from "./EliteDock";
import { useAuth } from "@/context/AuthContext";
import BodyMetricsOnboarding from "./BodyMetricsOnboarding";
import { useForegroundPush } from "@/hooks/useForegroundPush";

const AppShell = ({ children }: { children: ReactNode }) => {
  const { profile, isLoading } = useAuth();
  const needsOnboarding = !isLoading && profile && (profile.current_weight == null || profile.height_cm == null);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="relative mx-auto max-w-[430px] min-h-screen">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="px-4 pt-6 pb-32 min-h-screen no-scrollbar"
          style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </motion.main>
        <EliteDock />
      </div>
      {needsOnboarding && <BodyMetricsOnboarding />}
    </div>
  );
};

export default AppShell;