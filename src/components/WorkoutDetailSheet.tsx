import { motion, AnimatePresence } from "framer-motion";
import { X, Dumbbell, MessageSquare, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransformedWorkout, WorkoutExercise } from "@/hooks/useAssignedWorkouts";

interface WorkoutDetailSheetProps {
  workout: TransformedWorkout | null;
  onClose: () => void;
  onStartWorkout?: (workout: TransformedWorkout) => void;
}

const ExerciseRow = ({ exercise, index }: { exercise: WorkoutExercise; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.04 }}
    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
  >
    {/* Order number */}
    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-primary text-xs font-bold">{index + 1}</span>
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-foreground font-medium text-sm">{exercise.name}</p>

      {/* Badges row */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className="text-muted-foreground text-xs font-medium">
          {exercise.sets} × {exercise.reps}
        </span>

        {exercise.rir != null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-sky-500/15 text-sky-400 border-sky-500/20">
            RIR: {exercise.rir}
          </Badge>
        )}

        {exercise.failure_set && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-orange-500/15 text-orange-400 border-orange-500/20">
            🔥 TÜKENİŞ
          </Badge>
        )}

        {exercise.restTime && (
          <span className="text-muted-foreground/60 text-[10px]">
            ⏱ {exercise.restTime}
          </span>
        )}
      </div>

      {/* Exercise-level notes */}
      {exercise.notes && (
        <p className="text-muted-foreground text-xs mt-1.5 italic leading-relaxed">
          {exercise.notes}
        </p>
      )}
    </div>
  </motion.div>
);

const WorkoutDetailSheet = ({ workout, onClose, onStartWorkout }: WorkoutDetailSheetProps) => {
  if (!workout) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) onClose();
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-background rounded-t-3xl max-h-[90vh] overflow-hidden touch-none flex flex-col"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="px-5 pb-4 pt-2 flex items-start justify-between border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg text-foreground tracking-wide">{workout.title}</h2>
                <p className="text-muted-foreground text-xs">{workout.day} • {workout.exercises} hareket • {workout.duration}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Coach Note Callout */}
            {workout.coachNote && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4 flex items-start gap-3"
              >
                <MessageSquare className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-500 text-xs font-semibold uppercase tracking-wider mb-1">Koçun Notu</p>
                  <p className="text-foreground/80 text-sm leading-relaxed">{workout.coachNote}</p>
                </div>
              </motion.div>
            )}

            {/* Exercise List */}
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3 font-medium">Hareketler</p>
              <div className="space-y-2">
                {workout.programExercises.map((ex, i) => (
                  <ExerciseRow key={ex.id ?? i} exercise={ex} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => onStartWorkout?.(workout)}
              className="w-full py-3.5 rounded-xl bg-primary font-display text-primary-foreground tracking-wider flex items-center justify-center gap-2 active:bg-primary/90 transition-colors"
            >
              <Dumbbell className="w-4 h-4" />
              ANTRENMANI BAŞLAT
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkoutDetailSheet;
