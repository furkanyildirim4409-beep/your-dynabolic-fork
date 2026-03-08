import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Plus, Search, Flame, Beef, Wheat, Droplets, ChevronRight, ChevronDown, ChevronUp, X, Utensils, Camera, History, Apple, Coffee, Moon, Sun, Target, TrendingUp, Minus, Check } from "lucide-react";
import { foodDatabase, assignedSupplements } from "@/lib/mockData";
import SupplementTracker from "@/components/SupplementTracker";
import NutriScanner from "@/components/NutriScanner";
import NutritionHistory from "@/components/NutritionHistory";
import MacroDashboard from "@/components/MacroDashboard";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

const targets = { calories: 2600, protein: 180, carbs: 300, fat: 75 };

interface FoodItem {
  name: string;
  cal: number;
  p: number;
  c?: number;
  f?: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  icon: typeof Coffee;
  foods: FoodItem[];
  totalCal: number;
  totalProtein: number;
}

const initialMeals: Meal[] = [
  { id: "1", name: "Kahvaltı", time: "08:00", icon: Coffee, foods: [{ name: "Yumurta (3)", cal: 210, p: 18, c: 2, f: 15 }, { name: "Yulaf", cal: 180, p: 6, c: 30, f: 3 }, { name: "Muz", cal: 105, p: 1, c: 27, f: 0 }], totalCal: 495, totalProtein: 25 },
  { id: "2", name: "Ara Öğün", time: "10:30", icon: Apple, foods: [{ name: "Whey Protein", cal: 120, p: 24, c: 3, f: 1 }, { name: "Badem (30g)", cal: 170, p: 6, c: 6, f: 15 }], totalCal: 290, totalProtein: 30 },
  { id: "3", name: "Öğle Yemeği", time: "13:00", icon: Sun, foods: [{ name: "Tavuk Göğsü 200g", cal: 330, p: 62, c: 0, f: 7 }, { name: "Pirinç 150g", cal: 195, p: 4, c: 43, f: 0 }, { name: "Salata", cal: 45, p: 2, c: 8, f: 1 }], totalCal: 570, totalProtein: 68 },
  { id: "4", name: "Antrenman Sonrası", time: "17:00", icon: Utensils, foods: [{ name: "Whey + Kreatin", cal: 130, p: 25, c: 4, f: 1 }, { name: "Muz", cal: 105, p: 1, c: 27, f: 0 }], totalCal: 235, totalProtein: 26 },
  { id: "5", name: "Akşam Yemeği", time: "20:00", icon: Moon, foods: [{ name: "Somon 200g", cal: 400, p: 40, c: 0, f: 25 }, { name: "Tatlı Patates", cal: 180, p: 4, c: 41, f: 0 }, { name: "Brokoli", cal: 50, p: 4, c: 10, f: 0 }], totalCal: 630, totalProtein: 48 },
];

type ActiveTab = "today" | "history" | "scanner";

const Beslenme = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [supplements, setSupplements] = useState(assignedSupplements);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [meals, setMeals] = useState(initialMeals);
  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [showAddFood, setShowAddFood] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(1800);
  const waterTarget = 3000;

  const consumed = useMemo(() => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCal,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.foods.reduce((s, f) => s + (f.c || 0), 0),
      fat: acc.fat + meal.foods.reduce((s, f) => s + (f.f || 0), 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [meals]);

  const macros = [
    { label: "Kalori", icon: <Flame className="w-4 h-4" />, current: consumed.calories, target: targets.calories, unit: "kcal", colorClass: "text-orange-400" },
    { label: "Protein", icon: <Beef className="w-4 h-4" />, current: consumed.protein, target: targets.protein, unit: "g", colorClass: "text-destructive" },
    { label: "Karb", icon: <Wheat className="w-4 h-4" />, current: consumed.carbs, target: targets.carbs, unit: "g", colorClass: "text-yellow-400" },
    { label: "Yağ", icon: <Droplets className="w-4 h-4" />, current: consumed.fat, target: targets.fat, unit: "g", colorClass: "text-blue-400" },
  ];

  const handleAddFoodToMeal = (mealId: string, food: typeof foodDatabase[0]) => {
    hapticSuccess();
    setMeals(prev => prev.map(m => {
      if (m.id !== mealId) return m;
      const newFood: FoodItem = { name: food.name, cal: food.calories, p: food.protein, c: food.carbs, f: food.fat };
      return { ...m, foods: [...m.foods, newFood], totalCal: m.totalCal + food.calories, totalProtein: m.totalProtein + food.protein };
    }));
    setShowAddFood(null);
    setSearchQuery("");
    toast({ title: "Eklendi ✓", description: `${food.name} öğüne eklendi.` });
  };

  const handleAddWater = (amount: number) => {
    hapticLight();
    setWaterIntake(prev => Math.max(0, prev + amount));
    if (waterIntake + amount >= waterTarget) {
      toast({ title: "Su hedefine ulaştın! 💧", description: "Günlük su hedefinizi tamamladınız." });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <h1 className="font-display text-xl font-bold text-foreground">BESLENME</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-display">{consumed.calories}/{targets.calories} kcal</span>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Günlük makro takibi</p>
      </motion.div>

      {/* Tab navigation */}
      <Tabs value={activeTab} onValueChange={(v) => { hapticLight(); setActiveTab(v as ActiveTab); }}>
        <TabsList className="w-full grid grid-cols-3 bg-secondary/50 border border-border">
          <TabsTrigger value="today" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bugün</TabsTrigger>
          <TabsTrigger value="history" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Geçmiş</TabsTrigger>
          <TabsTrigger value="scanner" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tarayıcı</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "today" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Macro summary */}
          <div className="grid grid-cols-4 gap-2">
            {macros.map((m, i) => {
              const pct = Math.min((m.current / m.target) * 100, 100);
              return (
                <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-3 text-center">
                  <div className={`${m.colorClass} mb-1 flex justify-center`}>{m.icon}</div>
                  <p className="font-display text-lg text-foreground">{m.current}</p>
                  <p className="text-muted-foreground text-[10px]">/ {m.target}{m.unit}</p>
                  <Progress value={pct} className="h-1 mt-2" />
                </motion.div>
              );
            })}
          </div>

          {/* Calorie remaining card */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs">Kalan Kalori</p>
              <p className={`font-display text-2xl ${targets.calories - consumed.calories > 0 ? "text-foreground" : "text-destructive"}`}>
                {targets.calories - consumed.calories} kcal
              </p>
            </div>
            <div className="w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(consumed.calories / targets.calories) * 94.2} 94.2`} />
              </svg>
            </div>
          </div>

          {/* Water Tracking */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-foreground text-sm font-display">Su Takibi</span>
              </div>
              <span className="text-muted-foreground text-xs">{(waterIntake / 1000).toFixed(1)}L / {(waterTarget / 1000).toFixed(1)}L</span>
            </div>
            <Progress value={(waterIntake / waterTarget) * 100} className="h-2 mb-3" />
            <div className="flex gap-2">
              {[200, 330, 500].map(ml => (
                <Button key={ml} variant="outline" size="sm" onClick={() => handleAddWater(ml)} className="flex-1 h-9 text-xs border-border">
                  +{ml}ml
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => handleAddWater(-200)} className="h-9 text-xs border-border px-3">
                <Minus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Meals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Öğünler</h2>
              <span className="text-muted-foreground text-[10px]">{meals.length} öğün</span>
            </div>
            <div className="space-y-2">
              {meals.map((meal, i) => {
                const isExpanded = expandedMeal === meal.id;
                const MealIcon = meal.icon;
                return (
                  <motion.div key={meal.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
                    <button onClick={() => setExpandedMeal(isExpanded ? null : meal.id)} className="w-full p-3 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MealIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-primary text-xs font-display">{meal.time}</span>
                            <span className="text-foreground text-sm font-medium">{meal.name}</span>
                          </div>
                          <p className="text-muted-foreground text-[10px]">{meal.foods.length} besin</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-muted-foreground text-xs">{meal.totalCal} kcal</span>
                          <p className="text-primary text-[10px]">{meal.totalProtein}g P</p>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3 space-y-1.5">
                            {meal.foods.map((food, fi) => (
                              <div key={fi} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                                <span className="text-foreground text-xs">{food.name}</span>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                  <span>{food.cal} kcal</span>
                                  <span className="text-primary">{food.p}g P</span>
                                  {food.c !== undefined && <span>{food.c}g K</span>}
                                  {food.f !== undefined && <span>{food.f}g Y</span>}
                                </div>
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => setShowAddFood(meal.id)} className="w-full h-8 text-xs text-primary">
                              <Plus className="w-3 h-3 mr-1" /> Besin Ekle
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Food search */}
          <div>
            <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Besin Ara</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Yumurta, tavuk, pirinç..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
            </div>
            {searchQuery && (
              <div className="space-y-1">
                {foodDatabase.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8).map(food => (
                  <div key={food.id} className="glass-card p-3 flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm">{food.name}</p>
                      <p className="text-muted-foreground text-xs">{food.portion} • {food.protein}g protein</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{food.calories} kcal</span>
                      <button onClick={() => {
                        if (showAddFood) {
                          handleAddFoodToMeal(showAddFood, food);
                        } else {
                          toast({ title: "Öğün seç", description: "Önce bir öğün genişletip ekleyin." });
                        }
                      }} className="p-1.5 rounded-full bg-primary/20 text-primary">
                        <Plus className="w-3 h-3" />
                      </button>
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
              onToggleTaken={(id) => {
                hapticLight();
                setSupplements(prev => prev.map(s => s.id === id ? { ...s, takenToday: !s.takenToday } : s));
              }}
              onRefill={(id) => {
                toast({ title: "Yeniden sipariş verildi", description: "Takviye siparişiniz oluşturuldu." });
              }}
            />
          </div>
        </motion.div>
      )}

      {activeTab === "history" && <NutritionHistory />}
      {activeTab === "scanner" && <NutriScanner isOpen={activeTab === "scanner"} onClose={() => setActiveTab("today")} />}

      {/* Add Food to Meal Modal */}
      <AnimatePresence>
        {showAddFood && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end" onClick={() => setShowAddFood(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={e => e.stopPropagation()} className="w-full max-h-[80vh] bg-background rounded-t-2xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-foreground">Besin Ekle</h3>
                <button onClick={() => setShowAddFood(null)} className="p-2"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Besin ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" autoFocus />
              </div>
              <div className="space-y-1">
                {foodDatabase.filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12).map(food => (
                  <button key={food.id} onClick={() => handleAddFoodToMeal(showAddFood, food)} className="w-full glass-card p-3 flex items-center justify-between text-left">
                    <div>
                      <p className="text-foreground text-sm">{food.name}</p>
                      <p className="text-muted-foreground text-xs">{food.portion} • {food.protein}g P • {food.carbs}g K • {food.fat}g Y</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{food.calories} kcal</span>
                      <div className="p-1 rounded-full bg-primary/20"><Plus className="w-3 h-3 text-primary" /></div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Beslenme;
