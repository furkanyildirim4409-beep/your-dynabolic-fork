import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplets } from "lucide-react";

interface DayLog {
  date: string;
  dayLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
  adherence: number; // 0-100
}

const last7Days: DayLog[] = [
  { date: "2026-01-27", dayLabel: "Pzt", calories: 2580, protein: 175, carbs: 290, fat: 72, meals: 5, adherence: 95 },
  { date: "2026-01-26", dayLabel: "Paz", calories: 2100, protein: 140, carbs: 240, fat: 68, meals: 4, adherence: 78 },
  { date: "2026-01-25", dayLabel: "Cmt", calories: 2750, protein: 180, carbs: 310, fat: 80, meals: 5, adherence: 100 },
  { date: "2026-01-24", dayLabel: "Cum", calories: 2450, protein: 165, carbs: 270, fat: 70, meals: 5, adherence: 90 },
  { date: "2026-01-23", dayLabel: "Per", calories: 2300, protein: 155, carbs: 250, fat: 65, meals: 4, adherence: 85 },
  { date: "2026-01-22", dayLabel: "Çar", calories: 2650, protein: 178, carbs: 295, fat: 74, meals: 5, adherence: 98 },
  { date: "2026-01-21", dayLabel: "Sal", calories: 2200, protein: 150, carbs: 245, fat: 62, meals: 4, adherence: 80 },
];

const NutritionHistory = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const day = last7Days[selectedDay];
  const target = { calories: 2600, protein: 180, carbs: 300, fat: 75 };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Beslenme Geçmişi</h3>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5">
        {last7Days.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setSelectedDay(i)}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              selectedDay === i ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"
            }`}
          >
            <p className={`text-[10px] ${selectedDay === i ? "text-primary" : "text-muted-foreground"}`}>{d.dayLabel}</p>
            <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
              d.adherence >= 90 ? "bg-green-400" : d.adherence >= 70 ? "bg-yellow-400" : "bg-red-400"
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
            day.adherence >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
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
            const pct = Math.min((m.value / m.target) * 100, 100);
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
