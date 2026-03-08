import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Shield, ChevronRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DynabolicLogo from "@/components/DynabolicLogo";

type Phase = "idle" | "scanning" | "success" | "failed";

const BiometricLogin = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanProgress, setScanProgress] = useState(0);

  const startScan = () => {
    setPhase("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase("success");
          setTimeout(() => navigate("/kokpit"), 1200);
          return 100;
        }
        return p + 2;
      });
    }, 40);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-primary/3 blur-[80px]" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <DynabolicLogo size={60} />
        <p className="text-foreground font-display text-xl font-bold text-center mt-3 tracking-wider">DYNABOLIC</p>
        <p className="text-muted-foreground text-xs text-center mt-1">Biyometrik Giriş</p>
      </motion.div>

      {/* Fingerprint Scanner */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.95 }}
        onClick={phase === "idle" || phase === "failed" ? startScan : undefined}
        className="relative w-40 h-40 rounded-full flex items-center justify-center mb-8"
      >
        {/* Outer ring */}
        <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full">
          <circle cx="80" cy="80" r="76" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          {phase === "scanning" && (
            <motion.circle
              cx="80" cy="80" r="76" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 76}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 76 * (1 - scanProgress / 100) }}
              className="-rotate-90 origin-center"
            />
          )}
          {phase === "success" && (
            <motion.circle
              cx="80" cy="80" r="76" fill="none"
              stroke="hsl(142 71% 45%)"
              strokeWidth="3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}
        </svg>

        {/* Inner area */}
        <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
          phase === "scanning" ? "bg-primary/10" :
          phase === "success" ? "bg-green-500/10" :
          phase === "failed" ? "bg-destructive/10" : "bg-secondary"
        }`}>
          <AnimatePresence mode="wait">
            {phase === "success" ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <Shield className="w-6 h-6 text-green-400" />
              </motion.div>
            ) : (
              <motion.div
                key="finger"
                animate={phase === "scanning" ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Fingerprint className={`w-14 h-14 ${
                  phase === "scanning" ? "text-primary" :
                  phase === "failed" ? "text-destructive" : "text-muted-foreground"
                }`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center"
        >
          {phase === "idle" && (
            <>
              <p className="text-foreground text-sm font-medium">Parmağınızı yerleştirin</p>
              <p className="text-muted-foreground text-xs mt-1">Güvenli biyometrik doğrulama</p>
            </>
          )}
          {phase === "scanning" && (
            <>
              <p className="text-primary text-sm font-medium">Taranıyor...</p>
              <p className="text-muted-foreground text-xs mt-1">%{scanProgress}</p>
            </>
          )}
          {phase === "success" && (
            <>
              <p className="text-green-400 text-sm font-medium">Doğrulandı ✓</p>
              <p className="text-muted-foreground text-xs mt-1">Yönlendiriliyorsunuz...</p>
            </>
          )}
          {phase === "failed" && (
            <>
              <p className="text-destructive text-sm font-medium">Doğrulanamadı</p>
              <p className="text-muted-foreground text-xs mt-1">Tekrar deneyin</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Skip to login link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => navigate("/login")}
        className="absolute bottom-8 flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
      >
        <Lock className="w-3 h-3" />
        Şifre ile giriş yap
        <ChevronRight className="w-3 h-3" />
      </motion.button>
    </div>
  );
};

export default BiometricLogin;
