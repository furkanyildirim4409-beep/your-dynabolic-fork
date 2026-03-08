import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { useNutritionHistory } from "@/hooks/useNutritionLogs";
import { Skeleton } from "@/components/ui/skeleton";

const NutritionHistory = () => {
  const { history, isLoading } = useNutritionHistory(7);
  const [selectedDay, setSelectedDay] = useState(0);
  const target = { calories: 2200, protein: 180, carbs: 250, fat: 70 };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Beslenme Geçmişi</h3>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-12 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Beslenme Geçmişi</h3>
        </div>
        <div className="text-center py-8">
          <Flame className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Henüz beslenme kaydı bulunmuyor.</p>
        </div>
      </div>
    );
  }

  const day = history[selectedDay] || history[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Beslenme Geçmişi</h3>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5">
        {history.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setSelectedDay(i)}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              selectedDay === i ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"
            }`}
          >
            <p className={`text-[10px] ${selectedDay === i ? "text-primary" : "text-muted-foreground"}`}>{d.dayLabel}</p>
            <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
              d.adherence >= 90 ? "bg-green-400" : d.adherence >= 70 ? "bg-yellow-400" : d.adherence > 0 ? "bg-red-400" : "bg-muted-foreground/20"
            }`} />
          </button>
        ))}
      </div>

      {/* Day detail */}
      <motion.div
        key={selectedDay}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-foreground text-sm font-medium">{day.date}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            day.adherence >= 90 ? "bg-green-500/20 text-green-400" :
            day.adherence >= 70 ? "bg-yellow-500/20 text-yellow-400" :
            day.adherence > 0 ? "bg-red-500/20 text-red-400" : "bg-muted/20 text-muted-foreground"
          }`}>
            %{day.adherence} uyum
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Flame, label: "Kalori", value: day.calories, target: target.calories, unit: "kcal", color: "text-primary" },
            { icon: Beef, label: "Protein", value: day.protein, target: target.protein, unit: "g", color: "text-blue-400" },
            { icon: Wheat, label: "Karb", value: day.carbs, target: target.carbs, unit: "g", color: "text-orange-400" },
            { icon: Droplets, label: "Yağ", value: day.fat, target: target.fat, unit: "g", color: "text-yellow-400" },
          ].map((m) => {
            const Icon = m.icon;
            const pct = m.target > 0 ? Math.min((m.value / m.target) * 100, 100) : 0;
            return (
              <div key={m.label} className="text-center">
                <Icon className={`w-3.5 h-3.5 ${m.color} mx-auto mb-1`} />
                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                <p className="text-muted-foreground text-[10px]">/{m.target}{m.unit}</p>
                <div className="h-1 rounded-full bg-secondary mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${m.color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs mt-3 text-center">{day.meals} öğün kaydedildi</p>
      </motion.div>
    </div>
  );
};

export default NutritionHistory;
