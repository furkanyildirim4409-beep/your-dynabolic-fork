import { motion } from "framer-motion";
import { Flame, Beef, Wheat, Droplets, Zap, BarChart3 } from "lucide-react";
import { useNutritionStreak } from "@/hooks/useNutritionStreak";

interface MacroData {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

interface MacroDashboardProps {
  data?: MacroData;
}

const defaultData: MacroData = {
  calories: { current: 1850, target: 2600 },
  protein: { current: 145, target: 180 },
  carbs: { current: 210, target: 300 },
  fat: { current: 55, target: 75 },
};

const MacroDashboard = ({ data = defaultData }: MacroDashboardProps) => {
  const { streak } = useNutritionStreak(data.calories.target);

  const macros = [
    { key: "protein", label: "Protein", icon: Beef, current: data.protein.current, target: data.protein.target, unit: "g", color: "text-blue-400", bgColor: "bg-blue-400", trackColor: "bg-blue-400/20" },
    { key: "carbs", label: "Karbonhidrat", icon: Wheat, current: data.carbs.current, target: data.carbs.target, unit: "g", color: "text-orange-400", bgColor: "bg-orange-400", trackColor: "bg-orange-400/20" },
    { key: "fat", label: "Yağ", icon: Droplets, current: data.fat.current, target: data.fat.target, unit: "g", color: "text-yellow-400", bgColor: "bg-yellow-400", trackColor: "bg-yellow-400/20" },
  ];

  const calPercent = Math.min((data.calories.current / data.calories.target) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Calorie Ring */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="34" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - calPercent / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-4 h-4 text-primary mb-0.5" />
              <span className="text-foreground text-xs font-bold">{Math.round(calPercent)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-foreground font-display text-sm tracking-wide">KALORİ</p>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full"
                  >
                    <Zap className="w-3 h-3" />
                    <span className="text-[11px] font-bold">{streak} gün seri</span>
                  </motion.div>
                )}
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-primary">{data.calories.current.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">/ {data.calories.target.toLocaleString()} kcal</span>
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              Kalan: {Math.max(0, data.calories.target - data.calories.current).toLocaleString()} kcal
            </p>
          </div>
        </div>
      </motion.div>

      {/* Macro Bars */}
      <div className="grid grid-cols-3 gap-3">
        {macros.map((macro, index) => {
          const percent = Math.min((macro.current / macro.target) * 100, 100);
          const Icon = macro.icon;
          return (
            <motion.div
              key={macro.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 text-center"
            >
              <Icon className={`w-4 h-4 ${macro.color} mx-auto mb-1`} />
              <p className="text-foreground text-sm font-bold">{macro.current}{macro.unit}</p>
              <p className="text-muted-foreground text-[10px] mb-2">/ {macro.target}{macro.unit}</p>
              <div className={`h-1.5 rounded-full ${macro.trackColor} overflow-hidden`}>
                <motion.div
                  className={`h-full rounded-full ${macro.bgColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
              <p className="text-muted-foreground text-[10px] mt-1">{macro.label}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MacroDashboard;
