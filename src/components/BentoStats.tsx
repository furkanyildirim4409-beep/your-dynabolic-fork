import { motion } from "framer-motion";
import { Flame, Droplets, Battery, Moon } from "lucide-react";

export type BentoStatType = "calories" | "water" | "recovery" | "sleep";

interface BentoStatsProps {
  onStatClick?: (statType: BentoStatType) => void;
  realCalories?: number;
  realWater?: number;
  calorieTarget?: number;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
  type: BentoStatType;
  progress?: number;
  isEmpty?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  colorClass: string;
  bgColorClass: string;
  strokeColor: string;
}

const StatCard = ({ title, value, subtitle, badge, type, progress, isEmpty, onClick, icon, colorClass, bgColorClass, strokeColor }: StatCardProps) => {
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
      <div className={`absolute -bottom-8 -right-8 w-24 h-24 ${bgColorClass} opacity-10 blur-2xl rounded-full`} />
      
      {/* Title */}
      <p className="text-muted-foreground text-xs font-medium tracking-wider mb-3">
        {title}
      </p>

      {/* Calories - circular progress */}
      {type === "calories" && (
        <div className="relative w-16 h-16 mb-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
            <circle
              cx="32" cy="32" r="28"
              stroke={isEmpty ? "hsl(var(--muted))" : strokeColor}
              strokeWidth="6" fill="none" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28 * Math.min((progress || 0) / 100, 1)} ${2 * Math.PI * 28}`}
              className={isEmpty ? "" : "drop-shadow-[0_0_6px_hsl(24_95%_53%/0.5)]"}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-display text-lg ${isEmpty ? "text-muted-foreground" : colorClass}`}>{value}</span>
          </div>
        </div>
      )}

      {/* Water - fill bars */}
      {type === "water" && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <p className={`font-display text-2xl ${isEmpty ? "text-muted-foreground" : colorClass}`}>{value}</p>
          </div>
          {!isEmpty && (
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: 8 }, (_, i) => {
                const waterLiters = (progress || 0) / 1000;
                const filled = i < Math.ceil(waterLiters * 3);
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: filled ? "100%" : "30%" }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                    className={`flex-1 rounded-t-sm ${filled ? "bg-cyan-400" : "bg-cyan-400/20"}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recovery - awaiting data */}
      {type === "recovery" && (
        <div className="mb-3">
          <div className="flex items-end gap-1 h-12">
            {[40, 55, 48, 62, 75, 82, 92].map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${isEmpty ? 20 : height}%` }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className={`flex-1 rounded-t-sm ${isEmpty ? "bg-muted/40" : i === 6 ? "bg-primary" : "bg-primary/40"}`}
              />
            ))}
          </div>
          <p className={`font-display text-2xl mt-2 ${isEmpty ? "text-muted-foreground" : "text-primary"}`}>{value}</p>
        </div>
      )}

      {/* Sleep - awaiting data */}
      {type === "sleep" && (
        <div className="mb-2">
          <p className={`font-display text-2xl ${isEmpty ? "text-muted-foreground" : colorClass}`}>{value}</p>
          {badge && (
            <span className={`inline-block mt-2 text-[10px] px-2 py-1 rounded-full ${isEmpty ? "bg-muted/20 text-muted-foreground" : "bg-violet-500/20 text-violet-400"}`}>
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
      )}
    </motion.button>
  );
};

const BentoStats = ({ onStatClick, realCalories, realWater, calorieTarget }: BentoStatsProps) => {
  const hasCalories = realCalories !== undefined && realCalories !== null;
  const hasWater = realWater !== undefined && realWater !== null;

  const calorieProgress = calorieTarget && calorieTarget > 0
    ? (realCalories || 0) / calorieTarget * 100
    : 0;

  const waterDisplay = hasWater && realWater > 0
    ? `${(realWater / 1000).toFixed(1)}L`
    : "--";

  const calorieDisplay = hasCalories ? `${realCalories}` : "--";

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        title="KALORİ"
        value={calorieDisplay}
        type="calories"
        progress={calorieProgress}
        isEmpty={!hasCalories || realCalories === 0}
        subtitle={calorieTarget ? `Hedef: ${calorieTarget} kcal` : undefined}
        onClick={() => onStatClick?.("calories")}
        icon={<Flame className="w-5 h-5 text-orange-400" />}
        colorClass="text-orange-400"
        bgColorClass="bg-orange-500"
        strokeColor="hsl(24, 95%, 53%)"
      />
      <StatCard
        title="SU TÜKETİMİ"
        value={waterDisplay}
        type="water"
        progress={realWater || 0}
        isEmpty={!hasWater || realWater === 0}
        subtitle="Günlük hedef: 2.5L"
        onClick={() => onStatClick?.("water")}
        icon={<Droplets className="w-5 h-5 text-cyan-400" />}
        colorClass="text-cyan-400"
        bgColorClass="bg-cyan-500"
        strokeColor="hsl(187, 85%, 53%)"
      />
      <StatCard
        title="TOPARLANMA"
        value="--"
        type="recovery"
        isEmpty={true}
        subtitle="Veri Bekleniyor"
        onClick={() => onStatClick?.("recovery")}
        icon={<Battery className="w-5 h-5 text-muted-foreground" />}
        colorClass="text-primary"
        bgColorClass="bg-primary"
        strokeColor="hsl(var(--primary))"
      />
      <StatCard
        title="UYKU PUANI"
        value="--"
        type="sleep"
        isEmpty={true}
        badge="Veri Bekleniyor"
        subtitle="Veri Bekleniyor"
        onClick={() => onStatClick?.("sleep")}
        icon={<Moon className="w-5 h-5 text-muted-foreground" />}
        colorClass="text-violet-400"
        bgColorClass="bg-violet-500"
        strokeColor="hsl(270, 60%, 60%)"
      />
    </div>
  );
};

export default BentoStats;
