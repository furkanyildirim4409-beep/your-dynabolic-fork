import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, ChevronRight, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useExerciseRecords, type ExerciseRecord } from "@/hooks/useExerciseRecords";
import ExerciseRecordsModal from "./ExerciseRecordsModal";
import ExerciseSetHistoryModal from "./ExerciseSetHistoryModal";
import ExerciseSlotPickerModal from "./ExerciseSlotPickerModal";

const DEFAULT_SLOTS = [
  { name: "Bench Press", emoji: "🏋️" },
  { name: "Squat", emoji: "🦵" },
  { name: "Deadlift", emoji: "💀" },
  { name: "Shoulder Press", emoji: "💪" },
  { name: "Barbell Row", emoji: "🔥" },
];

const STORAGE_KEY = "exercise-record-slots";

interface SlotConfig {
  name: string;
  emoji: string;
}

const loadSlots = (): SlotConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_SLOTS;
};

const ExerciseGoalsSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quickDetail, setQuickDetail] = useState<ExerciseRecord | null>(null);
  const [slots, setSlots] = useState<SlotConfig[]>(loadSlots);
  const { data, isLoading } = useExerciseRecords();
  const allExercises = data?.allExercises ?? [];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }, [slots]);

  const matchExercise = (slotName: string) => {
    const q = slotName.toLowerCase();
    return allExercises.find(e => e.name.toLowerCase().includes(q));
  };

  const handleSlotClick = (e: React.MouseEvent, slot: SlotConfig) => {
    e.stopPropagation();
    const match = matchExercise(slot.name);
    if (match) {
      setQuickDetail(match);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm text-foreground tracking-wide">
              EGZERSİZ REKORLARI
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
              className="p-1 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-[10px]">Tümünü gör</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-2">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-12 h-2 rounded" />
                <Skeleton className="w-8 h-2 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {slots.map((slot, index) => {
              const match = matchExercise(slot.name);
              const hasData = match && match.maxWeight > 0;
              return (
                <motion.div
                  key={`${slot.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  onClick={(e) => handleSlotClick(e, slot)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary/50 border transition-all cursor-pointer active:scale-95 ${
                    hasData ? "border-primary/20 hover:border-primary/40" : "border-transparent"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                    {slot.emoji}
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2">
                    {slot.name.length > 14 ? slot.name.slice(0, 14) + "…" : slot.name}
                  </span>
                  {hasData ? (
                    <span className="text-[10px] font-display text-primary">
                      {match.maxWeight} kg
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40">—</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <ExerciseRecordsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        exercises={allExercises}
      />

      <ExerciseSetHistoryModal
        exercise={quickDetail}
        onClose={() => setQuickDetail(null)}
      />

      <ExerciseSlotPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentSlots={slots}
        onSave={setSlots}
        allExercises={allExercises}
      />
    </>
  );
};

export default ExerciseGoalsSection;
