import { ReactNode } from "react";
import { motion } from "framer-motion";
import EliteDock from "./EliteDock";

const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="relative w-full h-full bg-background flex flex-col overflow-hidden">
    <div className="fixed inset-0 grid-pattern pointer-events-none" />
    <div className="relative mx-auto w-full max-w-[430px] flex-1 flex flex-col overflow-hidden">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="px-4 pt-2 flex-1 overflow-y-auto no-scrollbar"
        style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </motion.main>
      <EliteDock />
    </div>
  </div>
);

export default AppShell;