import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, Plus, X, ChevronRight } from "lucide-react";

interface ExerciseRestTimerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  currentExercise?: string;
  nextExercise?: string;
  nextExerciseDetails?: { sets: number; reps: number; weight?: number };
  onSkip?: () => void;
}

const ExerciseRestTimerOverlay = ({
  isOpen, onClose, duration = 90,
  currentExercise = "Bench Press",
  nextExercise = "Incline Dumbbell Press",
  nextExerciseDetails = { sets: 4, reps: 10, weight: 35 },
  onSkip,
}: ExerciseRestTimerOverlayProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);
  const [totalTime, setTotalTime] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(duration);
      setTotalTime(duration);
      setIsRunning(true);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOpen, duration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isFinished = timeLeft === 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border rounded-t-2xl p-4 pb-8"
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-secondary">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Current exercise label */}
        <p className="text-muted-foreground text-xs text-center mb-1">
          {currentExercise} tamamlandı
        </p>

        {/* Timer */}
        <div className="text-center mb-4">
          <motion.p
            key={timeLeft}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            className={`font-display text-5xl font-bold ${isFinished ? "text-primary" : timeLeft <= 10 ? "text-destructive" : "text-foreground"}`}
          >
            {mins}:{secs.toString().padStart(2, "0")}
          </motion.p>
          {isFinished && <p className="text-primary text-sm mt-1">Hazır! Sonraki harekete geç 💪</p>}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-4">
          <motion.div
            className={`h-full rounded-full ${isFinished ? "bg-primary" : timeLeft <= 10 ? "bg-destructive" : "bg-primary"}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setTimeLeft((t) => t + 30); setTotalTime((t) => t + 30); }}
            className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 30sn
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRunning(!isRunning)}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
          >
            {isRunning ? <Pause className="w-5 h-5 text-primary-foreground" /> : <Play className="w-5 h-5 text-primary-foreground ml-0.5" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { onSkip?.(); onClose(); }}
            className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground flex items-center gap-1"
          >
            <SkipForward className="w-3 h-3" /> Atla
          </motion.button>
        </div>

        {/* Next exercise preview */}
        {nextExercise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Sıradaki</p>
              <p className="text-foreground text-sm font-medium truncate">{nextExercise}</p>
              <p className="text-muted-foreground text-xs">
                {nextExerciseDetails.sets}x{nextExerciseDetails.reps}
                {nextExerciseDetails.weight && ` • ${nextExerciseDetails.weight}kg`}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ExerciseRestTimerOverlay;
