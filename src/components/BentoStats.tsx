import { motion } from "framer-motion";
import { wearableMetrics } from "@/lib/mockData";

export type BentoStatType = "strain" | "recovery" | "sleep" | "hrv";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
  type: BentoStatType;
  progress?: number;
  onClick?: () => void;
}

const StatCard = ({ title, value, subtitle, badge, type, progress, onClick }: StatCardProps) => {
  const typeConfig = {
    strain: { 
      bgColor: "bg-stat-strain",
      textColor: "text-stat-strain",
      strokeColor: "hsl(var(--stat-strain))"
    },
    recovery: { 
      bgColor: "bg-primary",
      textColor: "text-primary",
      strokeColor: "hsl(var(--primary))"
    },
    sleep: { 
      bgColor: "bg-stat-sleep",
      textColor: "text-stat-sleep",
      strokeColor: "hsl(var(--stat-sleep))"
    },
    hrv: { 
      bgColor: "bg-stat-hrv",
      textColor: "text-stat-hrv",
      strokeColor: "hsl(var(--stat-hrv))"
    },
  };

  const config = typeConfig[type];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card-premium p-4 relative overflow-hidden group transition-all duration-300 hover:border-primary/20 text-left w-full"
    >
      {/* Background Glow */}
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 ${config.bgColor} opacity-10 blur-2xl rounded-full`} />
      
      {/* Title */}
      <p className="text-muted-foreground text-xs font-medium tracking-wider mb-3">
        {title}
      </p>

      {/* Visual based on type */}
      {type === "strain" && progress !== undefined && (
        <div className="relative w-16 h-16 mb-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke={config.strokeColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28 * (progress / 21)} ${2 * Math.PI * 28}`}
              className="drop-shadow-[0_0_6px_hsl(var(--stat-strain))]"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-display text-lg ${config.textColor}`}>{value}</span>
          </div>
        </div>
      )}

      {type === "recovery" && (
        <div className="mb-3">
          <div className="flex items-end gap-1 h-12">
            {[40, 55, 48, 62, 75, 82, 92].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className={`flex-1 rounded-t-sm ${
                  i === 6 ? "bg-primary" : "bg-primary/40"
                }`}
              />
            ))}
          </div>
          <p className={`font-display text-2xl ${config.textColor} mt-2`}>{value}</p>
        </div>
      )}

      {type === "sleep" && (
        <div className="mb-2">
          <p className={`font-display text-2xl ${config.textColor}`}>{value}</p>
          {badge && (
            <span className={`inline-block mt-2 text-[10px] px-2 py-1 rounded-full bg-stat-sleep/20 ${config.textColor}`}>
              {badge}
            </span>
          )}
        </div>
      )}

      {type === "hrv" && (
        <div className="mb-2">
          <p className={`font-display text-2xl ${config.textColor}`}>{value}</p>
          {/* Mini ECG Line */}
          <svg className="w-full h-8 mt-2" viewBox="0 0 100 20">
            <motion.path
              d="M0,10 L20,10 L25,2 L30,18 L35,10 L50,10 L55,5 L60,15 L65,10 L100,10"
              fill="none"
              stroke={config.strokeColor}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
      )}
    </motion.button>
  );
};

interface BentoStatsProps {
  onStatClick?: (statType: BentoStatType) => void;
}

const BentoStats = ({ onStatClick }: BentoStatsProps) => {
  // Calculate sleep in hours and minutes from wearableMetrics
  const totalSleepHours = wearableMetrics.sleep.total;
  const sleepHours = Math.floor(totalSleepHours);
  const sleepMinutes = Math.round((totalSleepHours - sleepHours) * 60);
  const sleepDisplay = `${sleepHours}sa ${sleepMinutes}dk`;

  // Calculate recovery based on HRV (higher HRV = better recovery)
  const hrvValue = wearableMetrics.hrv.value;
  const recoveryPercent = Math.min(Math.round((hrvValue / 50) * 100), 100);

  // Calculate daily strain based on steps (simplified calculation)
  const stepsPercent = (wearableMetrics.steps.value / wearableMetrics.steps.goal) * 100;
  const strainScore = Math.min((stepsPercent / 100) * 21, 21).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        title="GÜNLÜK YÜK"
        value={strainScore}
        type="strain"
        progress={parseFloat(strainScore)}
        subtitle={`Hedef: ${wearableMetrics.steps.goal.toLocaleString()} adım`}
        onClick={() => onStatClick?.("strain")}
      />
      <StatCard
        title="TOPARLANMA"
        value={`${recoveryPercent}%`}
        type="recovery"
        subtitle={recoveryPercent >= 80 ? "Çok İyi" : recoveryPercent >= 60 ? "İyi" : "Düşük"}
        onClick={() => onStatClick?.("recovery")}
      />
      <StatCard
        title="UYKU PUANI"
        value={sleepDisplay}
        type="sleep"
        badge={`Derin Uyku: %${wearableMetrics.sleep.deep}`}
        onClick={() => onStatClick?.("sleep")}
      />
      <StatCard
        title="HRV (STRES)"
        value={`${wearableMetrics.hrv.value}ms`}
        type="hrv"
        subtitle={wearableMetrics.hrv.value >= 40 ? "Sinir Sistemi Dengede" : "Stres Yüksek"}
        onClick={() => onStatClick?.("hrv")}
      />
    </div>
  );
};

export default BentoStats;