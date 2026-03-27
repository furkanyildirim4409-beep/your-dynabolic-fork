import { motion } from "framer-motion";
import { Droplets, Undo2 } from "lucide-react";
import { useWaterTracking } from "@/hooks/useWaterTracking";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const DAILY_GOAL_ML = 2500;

const quickAdds = [
  { ml: 250, label: "+250ml", emoji: "🥛" },
  { ml: 500, label: "+500ml", emoji: "🚰" },
  { ml: 1000, label: "+1L", emoji: "💧" },
];

const WaterTrackerWidget = () => {
  const { totalMl, addWater, removeLatestWater, isLoading } = useWaterTracking();

  const progress = Math.min((totalMl / DAILY_GOAL_ML) * 100, 100);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  const handleAdd = async (ml: number) => {
    const err = await addWater(ml);
    if (!err) {
      toast({
        title: `Harika! +${ml}ml su eklendi 💧`,
        description: `Bugün toplam: ${((totalMl + ml) / 1000).toFixed(1)}L`,
      });
    }
  };

  const handleUndo = async () => {
    const err = await removeLatestWater();
    if (!err) {
      toast({ title: "Son bardak kaldırıldı", description: "Su kaydı geri alındı" });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-36 w-36 rounded-full mx-auto mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Droplets className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-foreground font-bold text-sm tracking-wide">SU TAKİBİ</span>
      </div>

      {/* Circular Ring */}
      <div className="flex justify-center mb-5">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="hsl(220, 80%, 50%)" />
                <stop offset="100%" stopColor="hsl(187, 80%, 55%)" />
              </linearGradient>
            </defs>
            {/* Background track */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="hsl(var(--border) / 0.3)"
              strokeWidth="10"
            />
            {/* Progress arc */}
            <motion.circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="url(#waterGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl">💧</span>
            <span className="text-foreground font-display font-bold text-xl leading-tight">
              {(totalMl / 1000).toFixed(1)}L
            </span>
            <span className="text-muted-foreground text-xs">
              / {(DAILY_GOAL_ML / 1000).toFixed(1)}L
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex gap-2 mb-3">
        {quickAdds.map((item) => (
          <motion.button
            key={item.ml}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAdd(item.ml)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-300 text-sm font-semibold hover:bg-blue-500/25 transition-colors"
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Undo */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleUndo}
        disabled={totalMl === 0}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border/50 text-muted-foreground text-xs font-medium hover:bg-secondary/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Geri Al
      </motion.button>
    </div>
  );
};

export default WaterTrackerWidget;
