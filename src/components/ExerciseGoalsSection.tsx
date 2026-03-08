import { useState } from "react";
import { motion } from "framer-motion";
import { Target, ChevronRight, Trophy, TrendingUp } from "lucide-react";
import ExerciseHistoryModal from "./ExerciseHistoryModal";

// Common exercises users might want to set goals for
const popularExercises = [
  { name: "Bench Press", icon: "🏋️" },
  { name: "Squat", icon: "🦵" },
  { name: "Deadlift", icon: "💪" },
  { name: "Shoulder Press", icon: "🏋️" },
  { name: "Barbell Row", icon: "🚣" },
];

const ExerciseGoalsSection = () => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

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
              EGZERSİZ HEDEFLERİ
            </h2>
          </div>
          <span className="text-[10px] text-muted-foreground">Hedef belirle & takip et</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {popularExercises.map((exercise, index) => (
            <motion.button
              key={exercise.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedExercise(exercise.name)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/50 hover:bg-primary/20 border border-transparent hover:border-primary/30 transition-all"
            >
              <span className="text-xl">{exercise.icon}</span>
              <span className="text-[9px] text-muted-foreground text-center leading-tight line-clamp-2">
                {exercise.name.split(" ").slice(0, 2).join(" ")}
              </span>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-[10px] mt-3">
          Egzersize tıklayarak hedef belirle ve geçmişi gör
        </p>
      </motion.div>

      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        exerciseName={selectedExercise || ""}
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </>
  );
};

export default ExerciseGoalsSection;