import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, BarChart3, ChevronRight, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { hapticSuccess } from "@/lib/haptics";
import type { CoachAdjustment } from "@/types/shared-models";

interface CoachAdjustmentBannerProps {
  adjustment: CoachAdjustment | null;
  onDismiss: (adjustmentId: string) => void;
}

const CoachAdjustmentBanner = ({ adjustment, onDismiss }: CoachAdjustmentBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!adjustment || !isVisible) return null;

  const typeConfig = {
    calories: {
      icon: Flame,
      label: "KALORİ GÜNCELLEMESİ",
      formatValue: (v: number) => `${v} kcal`,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/50",
      glowColor: "shadow-orange-500/20",
    },
    intensity: {
      icon: Zap,
      label: "YOĞUNLUK GÜNCELLEMESİ",
      formatValue: (v: number) => `%${v}`,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/50",
      glowColor: "shadow-amber-500/20",
    },
    volume: {
      icon: BarChart3,
      label: "HACİM GÜNCELLEMESİ",
      formatValue: (v: number) => `${v} set`,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/50",
      glowColor: "shadow-yellow-500/20",
    },
  };

  const config = typeConfig[adjustment.type] || typeConfig.calories;
  const Icon = config.icon;

  const handleDismiss = () => {
    // Immediate UI feedback
    hapticSuccess();
    setIsVisible(false);
    
    // Persist to localStorage via parent
    onDismiss(adjustment.id);
    
    // Show toast notification
    toast({
      title: "Koç ayarlaması onaylandı ✓",
      description: `${config.label} güncellendi`,
    });
  };

  return (
    <motion.div
      key={adjustment.id}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`relative z-10 backdrop-blur-xl bg-white/[0.03] border ${config.borderColor} rounded-2xl p-4 overflow-hidden shadow-lg ${config.glowColor}`}
    >
      {/* Animated Glow Border Effect */}
      <motion.div
        className={`absolute inset-0 ${config.bgColor} opacity-20 pointer-events-none`}
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors active:scale-95"
        aria-label="Kapat"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Header */}
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

      {/* Type Label */}
      <p className="font-display text-sm text-foreground tracking-wide mb-3">
        {config.label}
      </p>

      {/* Value Comparison */}
      <div className="flex items-center gap-3 mb-4">
        <span className="font-display text-lg text-muted-foreground line-through">
          {config.formatValue(adjustment.previousValue)}
        </span>
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <ChevronRight className={`w-5 h-5 ${config.color}`} />
        </motion.div>
        <span className={`font-display text-2xl ${config.color}`}>
          {config.formatValue(adjustment.value)}
        </span>
      </div>

      {/* Coach Message */}
      <div className={`${config.bgColor} rounded-xl p-3 mb-4`}>
        <p className="text-foreground/90 text-sm italic leading-relaxed">
          "{adjustment.message}"
        </p>
      </div>

      {/* Acknowledge Button */}
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