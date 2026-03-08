import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Plus, Search, Flame, Beef, Wheat, Droplets, ChevronRight } from "lucide-react";
import { foodDatabase, assignedSupplements } from "@/lib/mockData";
import SupplementTracker from "@/components/SupplementTracker";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const targets = { calories: 2600, protein: 180, carbs: 300, fat: 75 };
const consumed = { calories: 1840, protein: 142, carbs: 210, fat: 52 };

const meals = [
  { id: "1", name: "Kahvaltı", time: "08:00", foods: [{ name: "Yumurta (3)", cal: 210, p: 18 }, { name: "Yulaf", cal: 180, p: 6 }], totalCal: 390, totalProtein: 24 },
  { id: "2", name: "Ara Öğün", time: "10:30", foods: [{ name: "Whey Protein", cal: 120, p: 24 }, { name: "Muz", cal: 105, p: 1 }], totalCal: 225, totalProtein: 25 },
  { id: "3", name: "Öğle Yemeği", time: "13:00", foods: [{ name: "Tavuk Göğsü 200g", cal: 330, p: 62 }, { name: "Pirinç 150g", cal: 195, p: 4 }], totalCal: 525, totalProtein: 66 },
  { id: "4", name: "Antrenman Sonrası", time: "17:00", foods: [{ name: "Whey + Kreatin", cal: 130, p: 25 }], totalCal: 130, totalProtein: 25 },
  { id: "5", name: "Akşam Yemeği", time: "20:00", foods: [{ name: "Somon 200g", cal: 400, p: 40 }, { name: "Sebze", cal: 70, p: 3 }], totalCal: 470, totalProtein: 43 },
];

const Beslenme = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [supplements, setSupplements] = useState(assignedSupplements);

  const macros = [
    { label: "Kalori", icon: <Flame className="w-4 h-4" />, current: consumed.calories, target: targets.calories, unit: "kcal", color: "text-orange-400" },
    { label: "Protein", icon: <Beef className="w-4 h-4" />, current: consumed.protein, target: targets.protein, unit: "g", color: "text-red-400" },
    { label: "Karb", icon: <Wheat className="w-4 h-4" />, current: consumed.carbs, target: targets.carbs, unit: "g", color: "text-yellow-400" },
    { label: "Yağ", icon: <Droplets className="w-4 h-4" />, current: consumed.fat, target: targets.fat, unit: "g", color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">BESLENME</h1>
        </div>
        <p className="text-muted-foreground text-xs">Günlük makro takibi</p>
      </motion.div>

      {/* Macro summary */}
      <div className="grid grid-cols-4 gap-2">
        {macros.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-3 text-center">
            <div className={`${m.color} mb-1 flex justify-center`}>{m.icon}</div>
            <p className="font-display text-lg text-foreground">{m.current}</p>
            <p className="text-muted-foreground text-[10px]">/ {m.target}{m.unit}</p>
            <Progress value={(m.current / m.target) * 100} className="h-1 mt-2" />
          </motion.div>
        ))}
      </div>

      {/* Meals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Öğünler</h2>
          <button className="text-primary text-xs flex items-center gap-1"><Plus className="w-3 h-3" /> Ekle</button>
        </div>
        <div className="space-y-2">
          {meals.map((meal, i) => (
            <motion.div key={meal.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs font-display">{meal.time}</span>
                  <span className="text-foreground text-sm font-medium">{meal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{meal.totalCal} kcal</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {meal.foods.map((food, fi) => (
                  <span key={fi} className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">{food.name}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Food search */}
      <div>
        <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Besin Ara</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Yumurta, tavuk, pirinç..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>
        {searchQuery && (
          <div className="space-y-1">
            {foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
              <div key={food.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm">{food.name}</p>
                  <p className="text-muted-foreground text-xs">{food.portion} • {food.protein}g protein</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{food.calories} kcal</span>
                  <button className="p-1 rounded-full bg-primary/20 text-primary"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supplements */}
      <div>
        <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Takviyeler</h2>
        <SupplementTracker
          supplements={supplements}
          onToggle={(id) => setSupplements(prev => prev.map(s => s.id === id ? { ...s, takenToday: !s.takenToday } : s))}
        />
      </div>
    </div>
  );
};

export default Beslenme;
