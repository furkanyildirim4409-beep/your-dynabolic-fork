import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"drawing" | "activating" | "fading">("drawing");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("activating"), 1000);
    const t2 = setTimeout(() => setPhase("fading"), 1800);
    const t3 = setTimeout(() => onComplete(), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <motion.div className="fixed inset-0 z-[9999] h-[100dvh] bg-black flex flex-col items-center justify-center overflow-hidden" initial={{ opacity: 1 }} animate={{ opacity: phase === "fading" ? 0 : 1 }} transition={{ duration: 0.5 }}>
      <motion.div className="relative z-10 flex flex-col items-center justify-center" initial={{ scale: 1 }} animate={{ scale: phase === "fading" ? 1.5 : 1, opacity: phase === "fading" ? 0 : 1 }} transition={{ duration: 0.5 }}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-40">
          <motion.path d="M 50 20 L 50 180 L 100 180 C 150 180 180 150 180 100 C 180 50 150 20 100 20 Z" stroke="#CCFF00" strokeWidth="5" fill="transparent" initial={{ pathLength: 0 }} animate={{ pathLength: 1, fill: phase !== "drawing" ? "rgba(204, 255, 0, 0.08)" : "transparent" }} transition={{ pathLength: { duration: 1 }, fill: { duration: 0.3 } }} />
          <motion.path d="M 110 50 L 90 95 L 115 95 L 95 150 L 135 105 L 110 105 Z" fill="#CCFF00" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: phase !== "drawing" ? 1 : 0, scale: phase !== "drawing" ? 1 : 0.8 }} transition={{ duration: 0.3 }} style={{ transformOrigin: "center" }} />
        </svg>
        <motion.div className="mt-10 text-center" initial={{ opacity: 0, y: 15 }} animate={{ opacity: phase !== "drawing" ? 1 : 0, y: phase !== "drawing" ? 0 : 15 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-display font-bold text-white tracking-[0.25em] uppercase">DYNABOLIC</h1>
          <motion.div className="h-0.5 bg-[#CCFF00] mt-2 mx-auto" initial={{ width: 0 }} animate={{ width: phase !== "drawing" ? "100%" : 0 }} transition={{ duration: 0.4 }} />
          <p className="text-[#CCFF00]/80 text-xs font-mono mt-2 tracking-widest">SYSTEM READY</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
