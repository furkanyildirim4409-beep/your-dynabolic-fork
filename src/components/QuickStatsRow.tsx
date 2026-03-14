import { motion } from "framer-motion";
import { Moon, Flame, Droplets } from "lucide-react";

type StatType = "sleep" | "calories" | "water";

interface QuickStatsRowProps {
  onStatClick?: (statType: StatType) => void;
  caloriesValue?: string;
  waterValue?: string;
  sleepValue?: string;
}

const QuickStatsRow = ({
  onStatClick,
  caloriesValue = "--",
  waterValue = "--",
  sleepValue = "--",
}: QuickStatsRowProps) => {
  const stats = [
    {
      id: "sleep" as StatType,
      icon: Moon,
      label: "Uyku",
      value: sleepValue,
      unit: "saat",
      color: "text-violet-400",
    },
    {
      id: "calories" as StatType,
      icon: Flame,
      label: "Kalori",
      value: caloriesValue,
      unit: "kcal",
      color: "text-orange-400",
    },
    {
      id: "water" as StatType,
      icon: Droplets,
      label: "Su",
      value: waterValue,
      unit: "L",
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, index) => (
        <motion.button
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onStatClick?.(stat.id)}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center hover:bg-white/[0.05] hover:border-white/[0.08] transition-all"
        >
          <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />
          <p className="text-foreground font-bold text-lg leading-none">
            {stat.value}
            {stat.unit && stat.value !== "--" && (
              <span className="text-muted-foreground text-[10px] font-normal ml-0.5">
                {stat.unit}
              </span>
            )}
          </p>
          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mt-1">
            {stat.label}
          </p>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickStatsRow;
export type { StatType };
