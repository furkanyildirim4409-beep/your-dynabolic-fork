import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, BarChart3, ChevronRight, X, Activity, LucideIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { hapticSuccess } from "@/lib/haptics";
import type { CoachAdjustment } from "@/types/shared-models";

interface AdjustmentConfig {
  icon: LucideIcon;
  label: string;
  formatValue: (v: number) => string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

function getAdjustmentConfig(type: string): AdjustmentConfig {
  const t = (type || "").toLowerCase();

  if (t.includes("calori") || t.includes("diet") || t.includes("nutri")) {
    return {
      icon: Flame,
      label: "KALORİ GÜNCELLEMESİ",
      formatValue: (v) => `${v} kcal`,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/50",
      glowColor: "shadow-orange-500/20",
    };
  }

  if (t.includes("intens") || t.includes("work")) {
    return {
      icon: Zap,
      label: "YOĞUNLUK GÜNCELLEMESİ",
      formatValue: (v) => `%${v}`,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/50",
      glowColor: "shadow-amber-500/20",
    };
  }

  if (t.includes("vol")) {
    return {
      icon: BarChart3,
      label: "HACİM GÜNCELLEMESİ",
      formatValue: (v) => `${v} set`,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/50",
      glowColor: "shadow-yellow-500/20",
    };
  }

  return {
    icon: Activity,
    label: "GÜNCELLEME",
    formatValue: (v) => `${v}`,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/50",
    glowColor: "shadow-primary/20",
  };
}

interface CoachAdjustmentBannerProps {
  adjustment: CoachAdjustment | null;
  currentTargets?: { calories: number; protein: number; carbs: number; fat: number } | null;
  onDismiss: (adjustmentId: string) => void;
}

const CoachAdjustmentBanner = ({ adjustment, currentTargets, onDismiss }: CoachAdjustmentBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const { displayPrev, displayNew } = useMemo(() => {
    if (!adjustment) return { displayPrev: 0, displayNew: 0 };

    let prev = adjustment.previousValue;
    let next = adjustment.value;

    if (adjustment.isPercentageOnly && currentTargets && adjustment.percentageChange) {
      const typeStr = (adjustment.type || "").toLowerCase();
      let targetKey: keyof typeof currentTargets | null = null;

      if (typeStr.includes("calori") || typeStr.includes("diet") || typeStr.includes("nutri")) {
        targetKey = "calories";
      } else if (typeStr.includes("protein")) {
        targetKey = "protein";
      } else if (typeStr.includes("carb")) {
        targetKey = "carbs";
      } else if (typeStr.includes("fat") || typeStr.includes("yağ")) {
        targetKey = "fat";
      }

      if (targetKey && currentTargets[targetKey] !== undefined) {
        prev = currentTargets[targetKey];
        next = Math.round(prev * (1 + adjustment.percentageChange / 100));
      } else {
        // No matching target (e.g. intensity/volume) — show raw percentage
        prev = 0;
        next = adjustment.percentageChange;
      }
    }

    return { displayPrev: prev, displayNew: next };
  }, [adjustment, currentTargets]);

  if (!adjustment || !isVisible) return null;

  const config = getAdjustmentConfig(adjustment.type);
  const Icon = config.icon;

  const handleDismiss = () => {
    hapticSuccess();
    setIsVisible(false);
    onDismiss(adjustment.id);
    toast({
      title: "Koç ayarlaması onaylandı ✓",
      description: `${config.label} güncellendi`,
    });
  };

  // Hide the "previous" value if it's 0 and percentage-only with no target match
  const showComparison = !(adjustment.isPercentageOnly && displayPrev === 0);

  return (
    <motion.div
      key={adjustment.id}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`relative z-10 backdrop-blur-xl bg-white/[0.03] border ${config.borderColor} rounded-2xl p-4 overflow-hidden shadow-lg ${config.glowColor}`}
    >
      <motion.div
        className={`absolute inset-0 ${config.bgColor} opacity-20 pointer-events-none`}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors active:scale-95"
        aria-label="Kapat"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
        >
          <Icon className={`w-4 h-4 ${config.color}`} />
        </motion.div>
        <span className={`text-xs font-display tracking-wider ${config.color}`}>
          KOÇ AYARLAMASI
        </span>
      </div>

      <p className="font-display text-sm text-foreground tracking-wide mb-3">
        {config.label}
      </p>

      <div className="flex items-center gap-3 mb-4">
        {showComparison ? (
          <>
            <span className="font-display text-lg text-muted-foreground line-through">
              {config.formatValue(displayPrev)}
            </span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ChevronRight className={`w-5 h-5 ${config.color}`} />
            </motion.div>
            <span className={`font-display text-2xl ${config.color}`}>
              {config.formatValue(displayNew)}
            </span>
          </>
        ) : (
          <span className={`font-display text-2xl ${config.color}`}>
            {displayNew > 0 ? `+%${displayNew}` : `%${displayNew}`}
          </span>
        )}
      </div>

      <div className={`${config.bgColor} rounded-xl p-3 mb-4`}>
        <p className="text-foreground/90 text-sm italic leading-relaxed">
          "{adjustment.message}"
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDismiss}
        className={`relative z-20 w-full py-3 ${config.bgColor} border ${config.borderColor} rounded-xl font-display text-sm ${config.color} tracking-wider hover:bg-opacity-30 transition-all active:scale-[0.98]`}
      >
        ANLADIM
      </motion.button>
    </motion.div>
  );
};

export default CoachAdjustmentBanner;
