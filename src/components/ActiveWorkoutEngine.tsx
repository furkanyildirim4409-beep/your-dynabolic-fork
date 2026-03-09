import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, ChevronRight, Dumbbell, AlertTriangle } from "lucide-react";
import { TransformedWorkout, WorkoutExercise } from "@/hooks/useAssignedWorkouts";
import RestTimerOverlay from "@/components/RestTimerOverlay";
import WorkoutCompletionModal from "@/components/WorkoutCompletionModal";

interface ActiveWorkoutEngineProps {
  workout: TransformedWorkout;
  onClose: () => void;
  onComplete: () => void;
}

const parseRestSeconds = (restTime: string): number => {
  const match = restTime.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 90;
};

const ActiveWorkoutEngine = ({ workout, onClose, onComplete }: ActiveWorkoutEngineProps) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, Set<number>>>({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exercises = workout.programExercises;
  const currentExercise = exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets ?? 3;
  const completedForCurrent = completedSets[currentExerciseIndex]?.size ?? 0;

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isSetCompleted = (exIdx: number, setIdx: number) => completedSets[exIdx]?.has(setIdx) ?? false;

  const totalCompletedSets = Object.values(completedSets).reduce((acc, s) => acc + s.size, 0);
  const totalAllSets = exercises.reduce((acc, ex) => acc + (ex.sets ?? 3), 0);

  const nextExerciseName = currentExerciseIndex < exercises.length - 1
    ? exercises[currentExerciseIndex + 1].name
    : undefined;

  const handleFinishSet = useCallback(() => {
    setCompletedSets((prev) => {
      const copy = { ...prev };
      if (!copy[currentExerciseIndex]) copy[currentExerciseIndex] = new Set();
      const newSet = new Set(copy[currentExerciseIndex]);
      newSet.add(currentSetIndex);
      copy[currentExerciseIndex] = newSet;
      return copy;
    });

    const newCompletedCount = completedForCurrent + 1;

    if (newCompletedCount >= totalSets) {
      // All sets for this exercise done
      if (currentExerciseIndex >= exercises.length - 1) {
        // All exercises done!
        setShowCompletion(true);
      } else {
        // Move to next exercise after rest
        setShowRestTimer(true);
      }
    } else {
      // More sets remain — rest between sets
      setCurrentSetIndex(currentSetIndex + 1);
      setShowRestTimer(true);
    }
  }, [currentExerciseIndex, currentSetIndex, completedForCurrent, totalSets, exercises.length]);

  const handleRestComplete = useCallback(() => {
    setShowRestTimer(false);
    // If all sets of current exercise are done, advance
    const doneCount = completedSets[currentExerciseIndex]?.size ?? 0;
    if (doneCount >= totalSets && currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
    }
  }, [completedSets, currentExerciseIndex, totalSets, exercises.length]);

  const navigateToExercise = (idx: number) => {
    setCurrentExerciseIndex(idx);
    const done = completedSets[idx]?.size ?? 0;
    setCurrentSetIndex(Math.min(done, (exercises[idx]?.sets ?? 3) - 1));
  };

  if (!currentExercise) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-background flex flex-col"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5 text-primary" />
            <div>
              <p className="text-foreground font-display text-sm tracking-wide">{workout.title}</p>
              <p className="text-muted-foreground text-[10px]">{totalCompletedSets}/{totalAllSets} set tamamlandı</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-foreground text-sm">{formatElapsed(elapsedSeconds)}</span>
            </div>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Exercise Progress Strip */}
        <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto">
          {exercises.map((ex, idx) => {
            const exDone = completedSets[idx]?.size ?? 0;
            const exTotal = ex.sets ?? 3;
            const isActive = idx === currentExerciseIndex;
            const isComplete = exDone >= exTotal;
            return (
              <button
                key={idx}
                onClick={() => navigateToExercise(idx)}
                className={`flex-shrink-0 h-2 rounded-full transition-all ${
                  isActive ? "w-8 bg-primary" : isComplete ? "w-4 bg-primary/60" : "w-4 bg-secondary"
                }`}
              />
            );
          })}
        </div>

        {/* Main Exercise View */}
        <div className="flex-1 overflow-y-auto px-5 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentExerciseIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col pt-6"
            >
              {/* Exercise Name */}
              <h1 className="font-display text-2xl text-foreground tracking-wide mb-1">
                {currentExercise.name}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                Hareket {currentExerciseIndex + 1} / {exercises.length}
              </p>

              {/* Set Indicator */}
              <div className="bg-secondary/50 rounded-2xl p-6 mb-4 text-center">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Aktif Set</p>
                <p className="font-display text-5xl text-foreground mb-1">
                  {currentSetIndex + 1} <span className="text-muted-foreground text-2xl">/ {totalSets}</span>
                </p>
                <p className="text-primary text-lg font-medium mt-2">
                  {currentExercise.reps} tekrar
                </p>
              </div>

              {/* RIR / Failure Prompts */}
              {currentExercise.failure_set && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="bg-destructive/15 border border-destructive/30 rounded-xl p-4 mb-3 flex items-center gap-3"
                >
                  <span className="text-3xl">🔥</span>
                  <div>
                    <p className="text-destructive font-display text-sm tracking-wide">BU SET TÜKENİŞE KADAR!</p>
                    <p className="text-destructive/70 text-xs mt-0.5">Kas yetmezliğine kadar devam et</p>
                  </div>
                </motion.div>
              )}

              {currentExercise.rir != null && !currentExercise.failure_set && (
                <div className="bg-sky-500/10 border border-sky-500/25 rounded-xl p-4 mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sky-400 font-display text-lg">{currentExercise.rir}</span>
                  </div>
                  <div>
                    <p className="text-sky-400 font-display text-sm tracking-wide">
                      Hedef: {currentExercise.rir} Tekrar Kala Bırak
                    </p>
                    <p className="text-sky-400/60 text-xs mt-0.5">
                      RIR {currentExercise.rir} — Tankta {currentExercise.rir} tekrar bırak
                    </p>
                  </div>
                </div>
              )}

              {/* Exercise Notes */}
              {currentExercise.notes && (
                <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 mb-3">
                  <p className="text-yellow-500/80 text-xs italic leading-relaxed">
                    📝 {currentExercise.notes}
                  </p>
                </div>
              )}

              {/* Sets Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {Array.from({ length: totalSets }).map((_, si) => {
                  const done = isSetCompleted(currentExerciseIndex, si);
                  const active = si === currentSetIndex;
                  return (
                    <div
                      key={si}
                      className={`h-12 rounded-xl flex items-center justify-center font-display text-sm transition-all ${
                        done
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : active
                          ? "bg-primary text-primary-foreground border border-primary"
                          : "bg-secondary/50 text-muted-foreground border border-border/50"
                      }`}
                    >
                      {done ? "✓" : `Set ${si + 1}`}
                    </div>
                  );
                })}
              </div>

              {/* Rest time info */}
              <p className="text-muted-foreground text-xs text-center mb-4">
                Dinlenme: {currentExercise.restTime}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <div className="px-5 py-5 border-t border-border/50 safe-area-bottom">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleFinishSet}
            className="w-full min-h-[64px] rounded-2xl bg-primary text-primary-foreground font-display text-lg tracking-wider flex items-center justify-center gap-3 active:bg-primary/90 transition-colors"
          >
            SETİ BİTİR
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {nextExerciseName && completedForCurrent + 1 >= totalSets && (
            <p className="text-muted-foreground text-xs text-center mt-2">
              Sıradaki: {nextExerciseName}
            </p>
          )}
        </div>
      </motion.div>

      {/* Rest Timer */}
      <RestTimerOverlay
        isOpen={showRestTimer}
        onClose={handleRestComplete}
        initialSeconds={parseRestSeconds(currentExercise.restTime)}
        exerciseName={currentExercise.name}
        nextExercise={nextExerciseName}
      />

      {/* Quit Confirmation */}
      <AnimatePresence>
        {showQuitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowQuitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-14 h-14 rounded-full bg-destructive/15 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="font-display text-foreground text-lg mb-2">Antrenmanı Bırak?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Antrenmanı bitirmek istediğine emin misin? İlerleme kaydedilmeyecek.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-display text-sm tracking-wide"
                >
                  DEVAM ET
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-destructive/15 text-destructive font-display text-sm tracking-wide"
                >
                  BIRAK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <WorkoutCompletionModal
        isOpen={showCompletion}
        workout={workout}
        durationSeconds={elapsedSeconds}
        totalSetsCompleted={totalCompletedSets + 1}
        onComplete={onComplete}
      />
    </>
  );
};

export default ActiveWorkoutEngine;
