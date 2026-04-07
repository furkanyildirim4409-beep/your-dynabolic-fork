import { ReactNode } from "react";
import { motion } from "framer-motion";
import EliteDock from "./EliteDock";
import { useForegroundPush } from "@/hooks/useForegroundPush";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const AppShell = ({ children }: { children: ReactNode }) => {
  useForegroundPush();
  usePushNotifications();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="relative mx-auto max-w-[430px] min-h-screen">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="px-4 pb-32 min-h-screen no-scrollbar"
          style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}
        >
          {children}
        </motion.main>
        <EliteDock />
      </div>
    </div>
  );
};

export default AppShell;