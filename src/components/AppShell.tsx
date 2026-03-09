import { ReactNode } from "react";
import { motion } from "framer-motion";
import EliteDock from "./EliteDock";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="relative h-[100dvh] bg-background overflow-hidden flex flex-col">
    <div className="fixed inset-0 grid-pattern pointer-events-none" />
    <div className="relative mx-auto max-w-[430px] flex-1 flex flex-col overflow-hidden">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto px-4 pt-2 no-scrollbar overscroll-contain"
        style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </motion.main>
      <EliteDock />
    </div>
  </div>
);

export default AppShell;
