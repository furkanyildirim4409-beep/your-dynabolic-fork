import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Trophy, ChevronRight, Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useExerciseRecords } from "@/hooks/useExerciseRecords";
import ExerciseRecordsModal from "./ExerciseRecordsModal";

const ExerciseGoalsSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useExerciseRecords();
  const top5 = data?.top5Exercises ?? [];
  const allExercises = data?.allExercises ?? [];

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
        ) : top5.length === 0 ? (
          <div className="text-center py-6">
            <Dumbbell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">
              Antrenman yaptıkça rekorların burada belirecek.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {top5.map((exercise, index) => (
              <motion.div
                key={exercise.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary/50 border border-transparent"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2">
                  {exercise.name.length > 14 ? exercise.name.slice(0, 14) + "…" : exercise.name}
                </span>
                {exercise.maxWeight > 0 && (
                  <span className="text-[10px] font-display text-primary">
                    {exercise.maxWeight} kg
                  </span>
                )}
              </motion.div>
            ))}
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
