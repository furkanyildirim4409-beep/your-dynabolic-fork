import { ReactNode } from "react";
import { motion } from "framer-motion";
import EliteDock from "./EliteDock";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="relative min-h-[100dvh] bg-background">
    <div className="fixed inset-0 grid-pattern pointer-events-none" />
    <div className="relative mx-auto max-w-[430px] min-h-[100dvh]">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="px-4 pt-2 min-h-[100dvh] no-scrollbar"
        style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </motion.main>
      <EliteDock />
    </div>
  </div>
);

export default AppShell;