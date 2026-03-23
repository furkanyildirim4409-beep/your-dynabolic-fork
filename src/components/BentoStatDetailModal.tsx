import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Flame, Droplets, Battery, Moon, Activity } from "lucide-react";
import type { BentoStatType } from "./BentoStats";

type ViewPeriod = "7" | "30";

interface HistoryPoint {
  day: string;
  value: number;
}

interface StatConfig {
  icon: typeof Activity;
  label: string;
  unit: string;
  color: string;
  bgColor: string;
  history7: HistoryPoint[];
  average7: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  goal?: number;
  optimalRange?: { min: number; max: number };
  emptyMessage?: string;
}

const days7 = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const statConfigs: Record<string, StatConfig> = {
  calories: {
    icon: Flame,
    label: "Kalori",
    unit: "kcal",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    history7: days7.map((day) => ({ day, value: 0 })),
    average7: 0,
    trend: "stable",
    trendPercent: 0,
    emptyMessage: "Beslenme verileriniz burada gösterilecek",
  },
  water: {
    icon: Droplets,
    label: "Su Tüketimi",
    unit: "ml",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    history7: days7.map((day) => ({ day, value: 0 })),
    average7: 0,
    trend: "stable",
    trendPercent: 0,
    goal: 2500,
    emptyMessage: "Su tüketim verileriniz burada gösterilecek",
  },
  recovery: {
    icon: Battery,
    label: "Toparlanma",
    unit: "%",
    color: "text-primary",
    bgColor: "bg-primary/20",
    history7: days7.map((day) => ({ day, value: 0 })),
    average7: 0,
    trend: "stable",
    trendPercent: 0,
    optimalRange: { min: 66, max: 100 },
    emptyMessage: "Wearable cihaz bağlandığında toparlanma verileri burada gösterilecek",
  },
  sleep: {
    icon: Moon,
    label: "Uyku Süresi",
    unit: "saat",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    history7: days7.map((day) => ({ day, value: 0 })),
    average7: 0,
    trend: "stable",
    trendPercent: 0,
    goal: 8,
    emptyMessage: "Wearable cihaz bağlandığında uyku verileri burada gösterilecek",
  },
};

const fallbackConfig: StatConfig = {
  icon: Activity,
  label: "Veri",
  unit: "",
  color: "text-muted-foreground",
  bgColor: "bg-muted/20",
  history7: days7.map((day) => ({ day, value: 0 })),
  average7: 0,
  trend: "stable",
  trendPercent: 0,
  emptyMessage: "Bu metrik için henüz veri bulunmuyor",
};

interface BentoStatDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statType: BentoStatType | null;
}

const BentoStatDetailModal = ({ isOpen, onClose, statType }: BentoStatDetailModalProps) => {
  if (!statType) return null;

  const config = statConfigs[statType] || fallbackConfig;
  const Icon = config.icon;
  const hasData = config.history7.some((h) => h.value > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] bg-background border-t border-white/10 rounded-t-3xl overflow-hidden touch-none"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">{config.label}</h2>
                  <p className="text-muted-foreground text-xs">Detaylı görünüm</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-8 text-center">
              {!hasData ? (
                <div className="space-y-4">
                  <div className={`w-16 h-16 mx-auto rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${config.color} opacity-50`} />
                  </div>
                  <div>
                    <p className="text-foreground font-medium mb-1">Henüz Veri Yok</p>
                    <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
                      {config.emptyMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground text-4xl font-bold">
                    {config.average7}
                    <span className="text-muted-foreground text-lg font-normal ml-1">{config.unit}</span>
                  </p>
                  {config.goal && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Hedefe</span>
                        <span className="text-foreground">{config.average7}/{config.goal} {config.unit}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((config.average7 / config.goal) * 100, 100)}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${config.bgColor.replace('/20', '')}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pb-8" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BentoStatDetailModal;
