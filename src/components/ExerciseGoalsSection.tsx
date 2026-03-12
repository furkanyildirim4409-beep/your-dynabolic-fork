import { useState } from "react";
import { motion } from "framer-motion";
import { Target, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useExerciseRecords } from "@/hooks/useExerciseRecords";
import ExerciseRecordsModal from "./ExerciseRecordsModal";

const FIXED_SLOTS = [
  { name: "Bench Press", emoji: "🏋️" },
  { name: "Squat", emoji: "🦵" },
  { name: "Deadlift", emoji: "💀" },
  { name: "Shoulder Press", emoji: "💪" },
  { name: "Barbell Row", emoji: "🔥" },
];

const ExerciseGoalsSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useExerciseRecords();
  const allExercises = data?.allExercises ?? [];

  const matchExercise = (slotName: string) => {
    const q = slotName.toLowerCase();
    return allExercises.find(e => e.name.toLowerCase().includes(q));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm text-foreground tracking-wide">
              EGZERSİZ REKORLARI
            </h2>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[10px]">Tümünü gör</span>
            <ChevronRight className="w-3 h-3" />
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
            {FIXED_SLOTS.map((slot, index) => {
              const match = matchExercise(slot.name);
              return (
                <motion.div
                  key={slot.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary/50 border border-transparent"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                    {slot.emoji}
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2">
                    {slot.name}
                  </span>
                  {match && match.maxWeight > 0 ? (
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
    </>
  );
};

export default ExerciseGoalsSection;
