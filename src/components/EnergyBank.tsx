import { motion } from "framer-motion";
import { Battery, BatteryCharging, Zap } from "lucide-react";

interface EnergyBankProps {
  level?: number; // 0-100
  charging?: boolean;
}

const EnergyBank = ({ level = 75, charging = false }: EnergyBankProps) => {
  const getColor = () => {
    if (level > 60) return { text: "text-green-400", bg: "bg-green-400", glow: "shadow-green-400/20" };
    if (level > 30) return { text: "text-yellow-400", bg: "bg-yellow-400", glow: "shadow-yellow-400/20" };
    return { text: "text-red-400", bg: "bg-red-400", glow: "shadow-red-400/20" };
  };

  const colors = getColor();
  const label = level > 80 ? "Enerji Dolu" : level > 50 ? "İyi Durumda" : level > 30 ? "Azalıyor" : "Düşük Enerji";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-xl bg-card border border-border rounded-xl p-4 relative overflow-hidden"
    >
      <div className="flex items-center gap-3">
        {/* Battery Visual */}
        <div className="relative w-16 h-28">
          {/* Battery body */}
          <div className="absolute inset-x-0 bottom-0 h-24 rounded-lg border-2 border-border overflow-hidden bg-secondary/50">
            {/* Liquid fill */}
            <motion.div
              className={`absolute bottom-0 left-0 right-0 ${colors.bg} opacity-30`}
              initial={{ height: 0 }}
              animate={{ height: `${level}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Wave effect */}
            <motion.div
              className={`absolute left-0 right-0 h-2 ${colors.bg} opacity-20 rounded-full`}
              style={{ bottom: `${level}%` }}
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          {/* Battery cap */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 rounded-t-md bg-border" />
          {/* Level text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-display text-lg font-bold ${colors.text}`}>{level}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            {charging ? (
              <BatteryCharging className={`w-4 h-4 ${colors.text}`} />
            ) : (
              <Battery className={`w-4 h-4 ${colors.text}`} />
            )}
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Enerji</span>
          </div>
          <p className={`text-sm font-medium ${colors.text}`}>{label}</p>
          <p className="text-muted-foreground text-xs mt-1">
            {charging ? "Şarj oluyor..." : level < 50 ? "Dinlenme önerilir" : "Antrenman için uygun"}
          </p>

          {/* Mini progress */}
          <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${colors.bg}`}
            />
          </div>
        </div>
      </div>

      {/* Charging animation */}
      {charging && (
        <motion.div
          className="absolute top-2 right-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Zap className="w-4 h-4 text-primary fill-primary" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default EnergyBank;
