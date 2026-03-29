import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  Search,
  Plus,
  Minus,
  Camera,
  X,
  Focus,
  ScanBarcode,
  Trash2,
  Utensils,
  Pill,
  Loader2,
  Circle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SupplementTracker from "@/components/SupplementTracker";
import { assignedSupplements as initialSupplements } from "@/lib/mockData";
import type { Supplement } from "@/components/SupplementTracker";
import { useAuth } from "@/context/AuthContext";

import { useMacros } from "@/hooks/useMacros";
import { useConsumedFoods, type ApiFoodItem, type ConsumedFood } from "@/hooks/useConsumedFoods";
import WeeklyNutritionChart from "@/components/WeeklyNutritionChart";
import { DialogTrigger } from "@/components/ui/dialog";
import { useDietPlan, type PlannedFood } from "@/hooks/useDietPlan";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarClock, AlertTriangle, RefreshCw, CalendarDays, TrendingUp } from "lucide-react";
import NutritionCalendar from "@/components/NutritionCalendar";
import { useWeeklyAdherence } from "@/hooks/useWeeklyAdherence";
import WaterTrackerWidget from "@/components/WaterTrackerWidget";

// --- TİP TANIMLAMALARI ---
interface MealSlot {
  id: string;
  title: string;
  time: string;
  icon: string;
  color: string;
}

const mealSlots: MealSlot[] = [
  { id: "kahvalti", title: "Kahvaltı", time: "07:30", icon: "☕", color: "text-yellow-500" },
  { id: "ogle", title: "Öğle Yemeği", time: "12:45", icon: "☀️", color: "text-orange-500" },
  { id: "ara", title: "Ara Öğün", time: "16:00", icon: "🍏", color: "text-green-500" },
  { id: "aksam", title: "Akşam Yemeği", time: "19:30", icon: "🌙", color: "text-indigo-400" },
];

const SLOT_TO_MEAL_TYPE: Record<string, string> = {
  kahvalti: "breakfast",
  ogle: "lunch",
  ara: "snack",
  aksam: "dinner",
};

const MEAL_TYPE_TO_SLOT: Record<string, string> = {
  breakfast: "kahvalti",
  lunch: "ogle",
  snack: "ara",
  dinner: "aksam",
};

// --- MACRO DASHBOARD COMPONENT ---
const MacroDashboard = ({
  totals,
  macroGoals,
}: {
  totals: { protein: number; carbs: number; fat: number; calories: number };
  macroGoals: { protein: number; carbs: number; fat: number; calories: number } | null;
}) => {
  const hasGoals = macroGoals && macroGoals.calories > 0;

  const macros = [
    { label: "PROTEİN", current: Math.round(totals.protein), goal: hasGoals ? macroGoals.protein : null, color: "bg-yellow-500", textColor: "text-yellow-500" },
    { label: "KARBONHİDRAT", current: Math.round(totals.carbs), goal: hasGoals ? macroGoals.carbs : null, color: "bg-blue-500", textColor: "text-blue-500" },
    { label: "YAĞ", current: Math.round(totals.fat), goal: hasGoals ? macroGoals.fat : null, color: "bg-orange-500", textColor: "text-orange-500" },
  ];

  const calPercentage = hasGoals ? Math.min((totals.calories / macroGoals.calories) * 100, 100) : 0;

  return (
    <div className="bg-card border border-white/5 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MAKRO ÖZETİ</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-display font-bold text-primary">{Math.round(totals.calories)}</span>
          {hasGoals && (
            <span className="text-muted-foreground text-sm">/ {macroGoals.calories} kcal</span>
          )}
          {!hasGoals && <span className="text-muted-foreground text-sm">kcal</span>}
        </div>
      </div>
      {/* Calorie progress bar — only show if coach target exists */}
      {hasGoals && (
        <div className="h-2 w-full bg-white/5 rounded-full mb-4 overflow-hidden">
          <motion.div
            key={`cal-${Math.round(totals.calories)}`}
            initial={{ width: 0 }}
            animate={{ width: `${calPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      )}
      {!hasGoals && (
        <p className="text-muted-foreground text-[10px] mb-3">Koç hedefi atandığında ilerleme çubuğu görünecek</p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {macros.map((macro) => {
          const percentage = macro.goal ? Math.min((macro.current / macro.goal) * 100, 100) : 0;
          return (
            <div key={macro.label} className="bg-secondary/50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground mb-2 tracking-wide">{macro.label}</p>
              {macro.goal && (
                <div className="h-1.5 w-full bg-white/5 rounded-full mb-2 overflow-hidden">
                  <motion.div
                    key={`${macro.label}-${macro.current}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn("h-full rounded-full", macro.color)}
                  />
                </div>
              )}
              <div className="flex items-baseline gap-0.5">
                <span className={cn("font-display font-bold text-lg", macro.textColor)}>{macro.current}g</span>
                {macro.goal && <span className="text-muted-foreground text-xs">/ {macro.goal}g</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- CAMERA SCANNER COMPONENT ---
type ScannerMode = "meal" | "barcode";

const CameraScanner = ({
  isOpen,
  onClose,
  mode = "meal",
}: {
  isOpen: boolean;
  onClose: () => void;
  mode?: ScannerMode;
}) => {
  const [phase, setPhase] = useState<"camera" | "processing">("camera");

  const instructionText = mode === "barcode" ? "Barkodu çerçeve içine alın" : "Yiyeceği çerçeve içine alın";
  const processingText = mode === "barcode" ? "BARKOD TARANIYOR..." : "ÖĞÜN TARANIYOR...";

  const handleCapture = () => {
    setPhase("processing");
    setTimeout(() => {
      onClose();
      setPhase("camera");
      toast({
        title: "Analiz Tamamlandı ✅",
        description: mode === "barcode" ? "Barkod başarıyla tarandı." : "Öğün başarıyla tarandı ve sisteme eklendi.",
      });
    }, 2500);
  };

  const handleClose = () => {
    onClose();
    setPhase("camera");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-destructive"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="font-display text-sm text-white tracking-wider uppercase">
                {mode === "barcode" ? "BARKOD TARAYICI" : "NUTRİ-SCAN AI"}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {phase === "camera" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-72 h-72"
                  >
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary rounded-br-lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {mode === "barcode" ? (
                        <ScanBarcode className="w-12 h-12 text-primary/30" />
                      ) : (
                        <Focus className="w-12 h-12 text-primary/30" />
                      )}
                    </div>
                    <motion.div
                      className="absolute inset-0 border-2 border-primary/20 rounded-xl"
                      animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </div>
                <div className="absolute bottom-40 left-0 right-0 text-center">
                  <p className="text-muted-foreground text-sm">{instructionText}</p>
                </div>
              </div>
              <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCapture}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-black/20 flex items-center justify-center">
                    {mode === "barcode" ? (
                      <ScanBarcode className="w-6 h-6 text-black" />
                    ) : (
                      <Camera className="w-6 h-6 text-black" />
                    )}
                  </div>
                </motion.button>
              </div>
            </>
          )}

          {phase === "processing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
              <div className="relative w-48 h-48 mb-8">
                <motion.div
                  className="absolute inset-0 border-2 border-primary/30 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 border-2 border-primary/50 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    {mode === "barcode" ? (
                      <ScanBarcode className="w-12 h-12 text-primary" />
                    ) : (
                      <Camera className="w-12 h-12 text-primary" />
                    )}
                  </motion.div>
                </div>
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <motion.p
                className="font-display text-lg text-primary tracking-widest"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {processingText}
              </motion.p>
              <p className="text-muted-foreground text-sm mt-2">
                {mode === "barcode" ? "Ürün bilgileri alınıyor" : "Yapay zeka besinleri analiz ediyor"}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- PLANNED FOOD ROW (unchecked) ---
const PlannedFoodRow = ({
  food,
  onCheck,
  isToggling,
}: {
  food: PlannedFood;
  onCheck: () => void;
  isToggling: boolean;
}) => (
  <button
    onClick={onCheck}
    disabled={isToggling}
    className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-white/10 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center border border-muted-foreground/30 text-muted-foreground/40 group-hover:border-primary/50 group-hover:text-primary/50 transition-colors flex-shrink-0">
        {isToggling ? <Loader2 size={14} className="animate-spin" /> : <Circle size={14} />}
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{food.food_name}</p>
        {food.serving_size && <p className="text-[10px] text-muted-foreground/60">{food.serving_size}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="flex gap-1.5 text-[10px] text-muted-foreground/50">
        <span>{food.calories} kcal</span>
        <span className="text-yellow-500/50">P:{Math.round(food.protein)}</span>
        <span className="text-blue-500/50">K:{Math.round(food.carbs)}</span>
      </div>
    </div>
  </button>
);

// --- CHECKED PLANNED FOOD ROW ---
const CheckedPlannedFoodRow = ({
  food,
  onUncheck,
  isToggling,
}: {
  food: ConsumedFood;
  onUncheck: () => void;
  isToggling: boolean;
}) => (
  <button
    onClick={onUncheck}
    disabled={isToggling}
    className="w-full flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-emerald-500 text-white flex-shrink-0">
        {isToggling ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
      </div>
      <div className="text-left">
        <p className="text-sm font-medium text-foreground">{food.food_name}</p>
        {food.serving_size && <p className="text-[10px] text-muted-foreground">{food.serving_size}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">{food.calories} kcal</p>
        <div className="flex gap-1.5 text-[10px] text-muted-foreground justify-end">
          <span className="text-yellow-500/80">P:{Math.round(food.protein || 0)}</span>
          <span className="text-blue-500/80">K:{Math.round(food.carbs || 0)}</span>
        </div>
      </div>
    </div>
  </button>
);

// --- MANUAL CONSUMED FOOD ROW ---
const ManualFoodRow = ({ food, onRemove }: { food: ConsumedFood; onRemove: () => void }) => (
  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-primary/5 border-primary/20 transition-all group">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center border bg-primary border-primary text-primary-foreground flex-shrink-0">
        <Check size={14} strokeWidth={3} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{food.food_name}</p>
        <p className="text-xs text-muted-foreground">{food.serving_size || "100g"}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-foreground">{food.calories} kcal</p>
        <div className="flex gap-2 text-[10px] text-muted-foreground justify-end">
          <span className="text-yellow-500/80">P:{Math.round(food.protein || 0)}</span>
          <span className="text-blue-500/80">K:{Math.round(food.carbs || 0)}</span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  </div>
);

// --- EXPANDABLE MEAL CARD (with checklist) ---
const ExpandableMealCard = ({
  slot,
  consumedFoods,
  plannedFoods,
  consumedPlannedIds,
  onRemoveFood,
  onCheckPlanned,
  onUncheckPlanned,
}: {
  slot: MealSlot;
  consumedFoods: ConsumedFood[];
  plannedFoods: PlannedFood[];
  consumedPlannedIds: Map<string, string>;
  onRemoveFood: (id: string) => void;
  onCheckPlanned: (food: PlannedFood) => void;
  onUncheckPlanned: (consumedFoodId: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Separate consumed foods: checked planned vs manual
  const checkedPlannedFoods = consumedFoods.filter((f) => f.planned_food_id);
  const manualFoods = consumedFoods.filter((f) => !f.planned_food_id);

  // Unchecked planned foods
  const uncheckedPlanned = plannedFoods.filter((pf) => !consumedPlannedIds.has(pf.id));

  // Total cal = only consumed foods (checked + manual)
  const totalCal = consumedFoods.reduce((a, f) => a + (f.calories || 0), 0);
  const totalItems = consumedFoods.length + uncheckedPlanned.length;
  const checkedCount = consumedFoods.length;
  const hasPlannedItems = plannedFoods.length > 0;

  const handleCheck = async (food: PlannedFood) => {
    setTogglingIds((prev) => new Set(prev).add(food.id));
    try {
      await onCheckPlanned(food);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(food.id);
        return next;
      });
    }
  };

  const handleUncheck = async (consumedFoodId: string, plannedFoodId: string) => {
    setTogglingIds((prev) => new Set(prev).add(plannedFoodId));
    try {
      await onUncheckPlanned(consumedFoodId);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(plannedFoodId);
        return next;
      });
    }
  };

  return (
    <motion.div
      layout
      className={cn(
        "border rounded-2xl overflow-hidden mb-3 transition-colors",
        consumedFoods.length > 0 ? "bg-card border-primary/20" : "bg-card border-white/5",
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl relative flex-shrink-0", slot.color)}>
            {slot.icon}
            {hasPlannedItems && checkedCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-card">
                <span className="text-[9px] font-bold text-white">{checkedCount}</span>
              </div>
            )}
            {!hasPlannedItems && consumedFoods.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-card">
                <Check size={10} className="text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="text-left">
            <h3 className={cn("font-bold text-sm", consumedFoods.length > 0 ? "text-primary" : "text-foreground")}>{slot.title}</h3>
            <p className="text-muted-foreground text-xs">
              {hasPlannedItems
                ? `${checkedCount}/${plannedFoods.length} tamamlandı`
                : slot.time}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-foreground font-display font-bold text-lg">{totalCal}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </div>
          <ChevronDown className={cn("text-muted-foreground w-5 h-5 transition-transform duration-300", isOpen && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-t border-white/5 bg-secondary/10"
          >
            <div className="p-3 space-y-2">
              {/* Unchecked planned foods first */}
              {uncheckedPlanned.map((food) => (
                <PlannedFoodRow
                  key={`planned-${food.id}`}
                  food={food}
                  onCheck={() => handleCheck(food)}
                  isToggling={togglingIds.has(food.id)}
                />
              ))}

              {/* Checked planned foods */}
              {checkedPlannedFoods.map((food) => (
                <CheckedPlannedFoodRow
                  key={`checked-${food.id}`}
                  food={food}
                  onUncheck={() => handleUncheck(food.id, food.planned_food_id!)}
                  isToggling={togglingIds.has(food.planned_food_id!)}
                />
              ))}

              {/* Manual foods */}
              {manualFoods.map((food) => (
                <ManualFoodRow
                  key={`manual-${food.id}`}
                  food={food}
                  onRemove={() => onRemoveFood(food.id)}
                />
              ))}

              {/* Empty state */}
              {totalItems === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Bu öğünde henüz yiyecek yok.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- FOOD DETAIL WIZARD (for API food items) ---
const FoodDetailWizard = ({
  food,
  onConfirm,
  onBack,
}: {
  food: ApiFoodItem;
  onConfirm: (mealSlotId: string, grams: number) => void;
  onBack: () => void;
}) => {
  const [targetMeal, setTargetMeal] = useState("ogle");
  const [grams, setGrams] = useState("100");

  const gramsNum = parseInt(grams) || 0;
  const multiplier = gramsNum / 100;

  const calculatedValues = {
    cal: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier),
    carbs: Math.round(food.carbs * multiplier),
    fat: Math.round(food.fat * multiplier),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground rotate-90" />
        </button>
        <div>
          <h3 className="font-bold text-foreground">{food.name}</h3>
          {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
        </div>
      </div>

      <div className="bg-secondary/30 rounded-xl p-4">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">MİKTAR (GRAM)</label>
        <Input
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="bg-background border-border text-foreground text-lg font-display h-12"
        />
      </div>

      <div className="bg-secondary/30 rounded-xl p-4">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">HEDEF ÖĞÜN</label>
        <Select value={targetMeal} onValueChange={setTargetMeal}>
          <SelectTrigger className="bg-background border-border text-foreground h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {mealSlots.map((slot) => (
              <SelectItem key={slot.id} value={slot.id} className="text-foreground hover:bg-secondary/50">
                {slot.icon} {slot.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">HESAPLANAN DEĞERLER</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-lg font-display font-bold text-primary">{calculatedValues.cal}</p>
            <p className="text-[10px] text-muted-foreground">KCAL</p>
          </div>
          <div>
            <p className="text-lg font-display font-bold text-yellow-500">{calculatedValues.protein}g</p>
            <p className="text-[10px] text-muted-foreground">PROTEİN</p>
          </div>
          <div>
            <p className="text-lg font-display font-bold text-blue-500">{calculatedValues.carbs}g</p>
            <p className="text-[10px] text-muted-foreground">KARB</p>
          </div>
          <div>
            <p className="text-lg font-display font-bold text-orange-500">{calculatedValues.fat}g</p>
            <p className="text-[10px] text-muted-foreground">YAĞ</p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => onConfirm(targetMeal, gramsNum)}
        disabled={gramsNum <= 0}
        className="w-full h-12 bg-primary text-primary-foreground font-display text-lg tracking-wider hover:bg-primary/90"
      >
        ÖĞÜNE EKLE
      </Button>
    </div>
  );
};

// --- ANA SAYFA ---
const Beslenme = () => {
  const { user } = useAuth();
  const dbMacros = useMacros();
  const { dynamicTargets, plannedFoods, hasTemplate, isLoading: dietLoading, isFuture, isExpired, currentDayNumber, totalTemplateDays, dietStartDate, allFoods, dietDurationWeeks } = useDietPlan();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const weeklyAdherence = useWeeklyAdherence({ allFoods, dietStartDate, dietDurationWeeks, totalTemplateDays, hasTemplate });
  // Priority: dynamic (diet template sum) > coach DB targets > null
  const macroGoals = dynamicTargets
    ? { calories: dynamicTargets.calories, protein: dynamicTargets.protein, carbs: dynamicTargets.carbs, fat: dynamicTargets.fat }
    : dbMacros;
  const [chartOpen, setChartOpen] = useState(false);
  
  const {
    isLoading: foodsLoading,
    searchResults,
    isSearching,
    searchFood,
    addFood,
    removeFood,
    checkPlannedFood,
    uncheckPlannedFood,
    consumedPlannedIds,
    groupedByMeal,
    totals,
    setSearchResults,
  } = useConsumedFoods();

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>("meal");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState<ApiFoodItem | null>(null);
  const [activeTab, setActiveTab] = useState("meals");
  const [supplements, setSupplements] = useState<Supplement[]>(
    initialSupplements.map((s) => ({
      id: s.id,
      name: s.name,
      dosage: s.dosage,
      timing: s.timing,
      servingsLeft: s.servingsLeft,
      totalServings: s.totalServings,
      takenToday: s.takenToday,
      icon: s.icon,
    })),
  );

  // Group planned foods by slot id
  const plannedBySlot = useMemo(() => {
    const groups: Record<string, PlannedFood[]> = {
      kahvalti: [],
      ogle: [],
      ara: [],
      aksam: [],
    };
    plannedFoods.forEach((f) => {
      const slotId = MEAL_TYPE_TO_SLOT[f.meal_type] || "ara";
      if (groups[slotId]) groups[slotId].push(f);
    });
    return groups;
  }, [plannedFoods]);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }
      debounceRef.current = setTimeout(() => {
        searchFood(value);
      }, 300);
    },
    [searchFood, setSearchResults],
  );

  const openMealScanner = () => {
    setScannerMode("meal");
    setShowCamera(true);
  };

  const openBarcodeScanner = () => {
    setScannerMode("barcode");
    setShowCamera(true);
  };

  const handleRemoveFood = async (id: string) => {
    try {
      await removeFood(id);
      toast({ title: "Silindi 🗑️", description: "Yiyecek listeden kaldırıldı." });
    } catch {
      toast({ title: "Hata", description: "Silme sırasında bir hata oluştu.", variant: "destructive" });
    }
  };

  const handleCheckPlanned = async (food: PlannedFood) => {
    try {
      await checkPlannedFood(food);
      toast({ title: "Tamamlandı ✅", description: `${food.food_name} yenildi olarak işaretlendi.` });
    } catch {
      toast({ title: "Hata", description: "İşaretleme sırasında bir hata oluştu.", variant: "destructive" });
    }
  };

  const handleUncheckPlanned = async (consumedFoodId: string) => {
    try {
      await uncheckPlannedFood(consumedFoodId);
      toast({ title: "Geri alındı", description: "Yiyecek işareti kaldırıldı." });
    } catch {
      toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    }
  };

  const handleConfirmAddFood = async (targetMealId: string, grams: number) => {
    if (!selectedFood) return;
    try {
      await addFood(selectedFood, targetMealId, grams);
      const slotTitle = mealSlots.find((s) => s.id === targetMealId)?.title || "öğün";
      toast({ title: "Eklendi ✅", description: `${selectedFood.name} ${slotTitle} öğününe eklendi.` });
      setSelectedFood(null);
      setShowManualAdd(false);
      setSearchTerm("");
      setSearchResults([]);
    } catch {
      toast({ title: "Hata", description: "Kayıt sırasında bir hata oluştu.", variant: "destructive" });
    }
  };

  const handleToggleSupplement = (id: string) => {
    setSupplements((current) =>
      current.map((sup) => {
        if (sup.id !== id) return sup;
        const newTakenToday = !sup.takenToday;
        const newServingsLeft = newTakenToday
          ? Math.max(0, sup.servingsLeft - 1)
          : Math.min(sup.totalServings, sup.servingsLeft + 1);
        if (newTakenToday) {
          toast({ title: "Alındı ✓", description: `${sup.name} işaretlendi.` });
        }
        return { ...sup, takenToday: newTakenToday, servingsLeft: newServingsLeft };
      }),
    );
  };

  const handleRefillSupplement = (id: string) => {
    setSupplements((current) =>
      current.map((sup) => {
        if (sup.id !== id) return sup;
        toast({ title: "Stok Yenilendi 📦", description: `${sup.name} stoğu yenilendi.` });
        return { ...sup, servingsLeft: sup.totalServings };
      }),
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-6 pb-32">
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase font-display">Beslenme Planı</h1>
            <p className="text-muted-foreground text-sm">
              {macroGoals ? `Hedefine ${Math.max(0, Math.round(macroGoals.calories - totals.calories))} kcal kaldı` : "Koç henüz hedef belirlemedi"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              onClick={() => setCalendarOpen(true)}
              className="bg-secondary text-foreground hover:bg-secondary/80 rounded-xl h-10 w-10"
            >
              <CalendarDays size={20} />
            </Button>
            <Button
              size="icon"
              onClick={openBarcodeScanner}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 w-10"
            >
              <ScanBarcode size={20} />
            </Button>
          </div>
        </div>

        {/* MACRO DASHBOARD - clickable to open weekly chart */}
        <Dialog open={chartOpen} onOpenChange={setChartOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer hover:opacity-80 transition-opacity">
              <MacroDashboard totals={totals} macroGoals={macroGoals} />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Haftalık Beslenme Uyumu</DialogTitle>
            </DialogHeader>
            <WeeklyNutritionChart calorieTarget={macroGoals?.calories ?? 0} />
          </DialogContent>
        </Dialog>

        {/* WEEKLY ADHERENCE WIDGET */}
        {hasTemplate && weeklyAdherence.totalDays > 0 && (
          <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-secondary" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  className={weeklyAdherence.percentage >= 70 ? "stroke-emerald-500" : weeklyAdherence.percentage >= 40 ? "stroke-orange-500" : "stroke-destructive"}
                  strokeWidth="3"
                  strokeDasharray={`${weeklyAdherence.percentage * 0.9742} 97.42`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                %{weeklyAdherence.percentage}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Haftalık Uyum</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Son 7 günde <span className="font-semibold text-foreground">{weeklyAdherence.adherentDays}/{weeklyAdherence.totalDays}</span> gün hedefte (±150 kcal)
              </p>
            </div>
            <div className="flex gap-0.5">
              {weeklyAdherence.dayResults.map((d) => (
                <div
                  key={d.date}
                  className={`w-2 h-6 rounded-sm ${
                    d.adherent === true ? "bg-emerald-500" : d.adherent === false ? "bg-destructive/60" : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-white/[0.03] border border-white/5 p-1 h-12">
            <TabsTrigger
              value="meals"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium gap-2 text-sm"
            >
              <Utensils className="w-4 h-4" />
              ÖĞÜNLER
            </TabsTrigger>
            <TabsTrigger
              value="supplements"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium gap-2 text-sm"
            >
              <Pill className="w-4 h-4" />
              SUPPLEMENTLER
            </TabsTrigger>
          </TabsList>

          {/* Meals Tab Content */}
          <TabsContent value="meals" className="mt-4 space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={openMealScanner}
                className="flex items-center justify-center gap-2 bg-secondary border border-white/5 p-3 rounded-xl text-sm font-medium text-muted-foreground hover:border-primary/50 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4 text-primary" />
                Öğün Tara
              </button>
              <button
                onClick={() => setShowManualAdd(true)}
                className="flex items-center justify-center gap-2 bg-secondary border border-white/5 p-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/80 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-foreground" />
                Manuel Ekle
              </button>
            </div>

            {/* DIET TEMPORAL BANNERS */}
            {hasTemplate && isFuture && dietStartDate && (
              <Alert className="border-blue-500/30 bg-blue-500/10">
                <CalendarClock className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-sm text-blue-300">
                  Beslenme programın <span className="font-bold">{format(parseISO(dietStartDate), "dd MMMM yyyy", { locale: tr })}</span> tarihinde başlayacak.
                </AlertDescription>
              </Alert>
            )}
            {hasTemplate && isExpired && (
              <Alert className="border-orange-500/30 bg-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-sm text-orange-300">
                  Koçunun atadığı beslenme programının süresi doldu. Lütfen koçunla iletişime geç.
                </AlertDescription>
              </Alert>
            )}

            <WaterTrackerWidget />

            {/* MEAL LIST */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">BUGÜNKÜ ÖĞÜNLER</h2>
                {hasTemplate && !isFuture && !isExpired && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1 text-[10px] font-semibold">
                      <RefreshCw className="w-3 h-3" />
                      Gün {currentDayNumber} / {totalTemplateDays}
                    </Badge>
                    <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">📋 Koç Planı Aktif</span>
                  </div>
                )}
                {hasTemplate && (isFuture || isExpired) && (
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">📋 Koç Planı</span>
                )}
              </div>
              <div className="space-y-3">
                {mealSlots.map((slot) => (
                  <ExpandableMealCard
                    key={slot.id}
                    slot={slot}
                    consumedFoods={groupedByMeal[slot.id] || []}
                    plannedFoods={plannedBySlot[slot.id] || []}
                    consumedPlannedIds={consumedPlannedIds}
                    onRemoveFood={handleRemoveFood}
                    onCheckPlanned={handleCheckPlanned}
                    onUncheckPlanned={handleUncheckPlanned}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Supplements Tab Content */}
          <TabsContent value="supplements" className="mt-4">
            <SupplementTracker
              supplements={supplements}
              onToggleTaken={handleToggleSupplement}
              onRefill={handleRefillSupplement}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* CAMERA SCANNER */}
      <CameraScanner isOpen={showCamera} onClose={() => setShowCamera(false)} mode={scannerMode} />

      {/* NUTRITION CALENDAR DIALOG */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle>Beslenme Takvimi</DialogTitle>
          </DialogHeader>
          <NutritionCalendar
            allFoods={allFoods}
            dietStartDate={dietStartDate}
            dietDurationWeeks={dietDurationWeeks}
            totalTemplateDays={totalTemplateDays}
            hasTemplate={hasTemplate}
          />
        </DialogContent>
      </Dialog>

      {/* MANUAL ADD MODAL */}
      <Dialog
        open={showManualAdd}
        onOpenChange={(open) => {
          setShowManualAdd(open);
          if (!open) {
            setSelectedFood(null);
            setSearchTerm("");
            setSearchResults([]);
          }
        }}
      >
        <DialogContent className="bg-background border-border text-foreground max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedFood ? "Detayları Düzenle" : "Yiyecek Ekle"}</DialogTitle>
          </DialogHeader>

          {!selectedFood ? (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Yiyecek ara... (ör: elma, tavuk, pilav)"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="bg-secondary/30 border-border pl-10 text-foreground"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {isSearching && (
                  <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Aranıyor...</span>
                  </div>
                )}

                {!isSearching && searchTerm.trim().length > 0 && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">Sonuç bulunamadı</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Farklı bir arama terimi deneyin</p>
                  </div>
                )}

                {!isSearching && searchTerm.trim().length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Yiyecek aramak için yazın</p>
                  </div>
                )}

                {!isSearching &&
                  searchResults.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-colors text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{food.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {food.brand ? `${food.brand} • ` : ""}100g • {food.calories} kcal
                        </p>
                        <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="text-yellow-500/80">P:{food.protein}g</span>
                          <span className="text-blue-500/80">K:{food.carbs}g</span>
                          <span className="text-orange-500/80">Y:{food.fat}g</span>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors flex-shrink-0 ml-2">
                        <Plus className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
                      </div>
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <FoodDetailWizard
              food={selectedFood}
              onConfirm={handleConfirmAddFood}
              onBack={() => setSelectedFood(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Beslenme;
