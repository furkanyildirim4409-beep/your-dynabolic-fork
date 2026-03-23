import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Moon, Flame, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatHistory } from "@/hooks/useStatHistory";

type StatType = "sleep" | "calories" | "water";
type ViewPeriod = "7" | "30";

interface VisualConfig {
  icon: typeof Moon;
  label: string;
  unit: string;
  color: string;
  bgColor: string;
  barActiveClass: string;
}

const visualConfigs: Record<StatType, VisualConfig> = {
  sleep: {
    icon: Moon,
    label: "Uyku",
    unit: "saat",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    barActiveClass: "bg-violet-500",
  },
  calories: {
    icon: Flame,
    label: "Kalori",
    unit: "kcal",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    barActiveClass: "bg-orange-500",
  },
  water: {
    icon: Droplets,
    label: "Su",
    unit: "L",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    barActiveClass: "bg-cyan-500",
  },
};

interface StatDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statType: StatType | null;
  targets?: { calories?: number; protein?: number; carbs?: number; fat?: number } | null;
}

const StatDetailModal = ({ isOpen, onClose, statType, targets }: StatDetailModalProps) => {
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>("7");
  const { history, average, todayValue, trendPercent, trendDirection, isLoading } = useStatHistory(statType, viewPeriod);

  if (!statType) return null;

  const config = visualConfigs[statType];
  const Icon = config.icon;

  const goal = statType === "calories" ? (targets?.calories || 2200) : statType === "sleep" ? 8 : 3;

  const TrendIcon = trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;
  const trendColor = trendDirection === "up" ? "text-green-400" : trendDirection === "down" ? "text-red-400" : "text-muted-foreground";

  // For 30-day view, aggregate into weekly buckets
  const displayHistory = viewPeriod === "30" && history.length >= 28
    ? [
        { day: "H1", value: Math.round(history.slice(0, 7).reduce((a, b) => a + b.value, 0) / 7 * 10) / 10 },
        { day: "H2", value: Math.round(history.slice(7, 14).reduce((a, b) => a + b.value, 0) / 7 * 10) / 10 },
        { day: "H3", value: Math.round(history.slice(14, 21).reduce((a, b) => a + b.value, 0) / 7 * 10) / 10 },
        { day: "H4", value: Math.round(history.slice(21, 28).reduce((a, b) => a + b.value, 0) / 7 * 10) / 10 },
      ]
    : history;

  const displayMax = Math.max(...displayHistory.map((h) => h.value), 1);
  const hasData = history.some((h) => h.value > 0);

  const formatValue = (val: number) => statType === "calories" ? Math.round(val) : val;

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
                  <p className="text-muted-foreground text-xs">Son {viewPeriod} gün</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Toggle */}
            <div className="px-5 pb-4">
              <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                {(["7", "30"] as ViewPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setViewPeriod(p)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      viewPeriod === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p} Gün
                  </button>
                ))}
              </div>
            </div>

            {/* Current Value */}
            <div className="px-5 py-4 border-y border-white/[0.05]">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-28" />
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Bugün</p>
                      <p className="text-foreground text-4xl font-bold">
                        {formatValue(todayValue)}
                        <span className="text-muted-foreground text-lg font-normal ml-1">{config.unit}</span>
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{trendPercent}%</span>
                    </div>
                  </div>

                  {goal > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Hedefe</span>
                        <span className="text-foreground">{formatValue(todayValue)}/{goal} {config.unit}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((todayValue / goal) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${config.barActiveClass}`}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Chart */}
            <div className="px-5 py-5">
              {isLoading ? (
                <div className="flex items-end justify-between gap-2 h-32">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <Skeleton className="w-full h-16 rounded-t-md" />
                      <Skeleton className="h-3 w-6" />
                    </div>
                  ))}
                </div>
              ) : !hasData ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${config.color} opacity-40`} />
                    <p className="text-muted-foreground text-sm">Henüz yeterli veri yok</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2 h-32">
                  {displayHistory.map((point, index) => {
                    const heightPercent = (point.value / displayMax) * 100;
                    const isLast = index === displayHistory.length - 1;

                    return (
                      <div key={`${point.day}-${index}`} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full h-24 flex items-end justify-center">
                          <motion.div
                            key={`bar-${viewPeriod}-${index}`}
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className={`w-full max-w-[24px] rounded-t-md ${isLast ? config.barActiveClass : "bg-white/[0.08]"}`}
                          />
                        </div>
                        <span className={`text-[10px] font-medium ${isLast ? config.color : "text-muted-foreground"}`}>
                          {formatValue(point.value)}
                        </span>
                        <span className={`text-[10px] uppercase ${isLast ? "text-foreground" : "text-muted-foreground/60"}`}>
                          {point.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="px-5 pb-8 grid grid-cols-2 gap-3">
              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                  {viewPeriod === "7" ? "Haftalık" : "Aylık"} Ort.
                </p>
                <p className="text-foreground text-lg font-bold">
                  {isLoading ? <Skeleton className="h-6 w-12 mx-auto" /> : (
                    <>
                      {formatValue(average)}
                      <span className="text-muted-foreground text-xs font-normal ml-1">{config.unit}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-center">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Hedef</p>
                <p className="text-foreground text-lg font-bold">
                  {goal}
                  <span className="text-muted-foreground text-xs font-normal ml-1">{config.unit}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StatDetailModal;
