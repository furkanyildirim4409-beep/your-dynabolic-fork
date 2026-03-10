import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, Play, Pause, RotateCcw, Check, Activity, Target, Clock, Eye, EyeOff, Trophy, Info, History, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import RestTimerOverlay from "./RestTimerOverlay";
import ExerciseRestTimerOverlay from "./ExerciseRestTimerOverlay";
import ExerciseHistoryModal from "./ExerciseHistoryModal";
import { toast } from "sonner";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useStableTimer } from "@/hooks/useStableTimer";
import { useWakeLock } from "@/hooks/useWakeLock";

interface ProgramExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  notes: string | null;
  videoUrl: string | null;
  rir?: number;
  rirPerSet?: number[];
  rpe?: number;
  failureSet?: boolean;
  groupId?: string;
}

interface VisionAIExecutionProps {
  workoutTitle: string;
  exercises?: ProgramExercise[];
  assignmentId?: string;
  onClose: () => void;
}

interface Exercise {
  id: string;
  name: string;
  targetReps: number;
  tempo: string;
  sets: number;
  reps: number;
  restDuration: number;
  rpe: number;
  notes?: string;
  category?: string;
  videoUrl?: string;
  rir?: number;
  rirPerSet?: number[];
  failureSet?: boolean;
  groupId?: string;
}

const getRPEColor = (rpe: number): { bg: string; text: string; border: string } => {
  if (rpe <= 5) return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/50" };
  if (rpe <= 7) return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/50" };
  if (rpe <= 9) return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/50" };
  return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/50" };
};

const VisionAIExecution = ({ workoutTitle, exercises: propExercises, assignmentId, onClose }: VisionAIExecutionProps) => {
  const { triggerAchievement } = useAchievements();
  const { user } = useAuth();
  
  const exercises: Exercise[] = (propExercises ?? []).map(ex => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets ?? 3,
    targetReps: parseInt(ex.reps) || 10,
    reps: parseInt(ex.reps) || 10,
    tempo: "3-1-2",
    restDuration: parseInt(ex.restTime) || 60,
    rpe: typeof ex.rpe === 'number' ? ex.rpe : 7,
    notes: ex.notes ?? undefined,
    videoUrl: ex.videoUrl ?? undefined,
    rir: ex.rir,
    rirPerSet: Array.isArray(ex.rirPerSet) ? ex.rirPerSet : undefined,
    failureSet: ex.failureSet,
    groupId: ex.groupId,
  }));
  
  const { seconds: timer, isRunning, pause: pauseTimer, resume: resumeTimer, toggle: toggleTimer, reset: resetTimer } = useStableTimer({ mode: "up", autoStart: true });
  useWakeLock();
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [visionAIActive, setVisionAIActive] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExerciseRestTimer, setShowExerciseRestTimer] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false);
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [showExerciseHistory, setShowExerciseHistory] = useState(false);
  const [simulatedHeartRate, setSimulatedHeartRate] = useState(72);
  const [showVisionInfo, setShowVisionInfo] = useState(false);
  const [showRpeInfo, setShowRpeInfo] = useState(false);
  const [showHeartRateInfo, setShowHeartRateInfo] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [achievedFailure, setAchievedFailure] = useState(false);
  const [previousWorkout, setPreviousWorkout] = useState<any>(null);

  // Track completed sets per exercise: { [exerciseIndex]: [{weight, reps, isFailure}] }
  const completedSetsRef = useRef<Record<number, { weight: number; reps: number; isFailure: boolean }[]>>({});
  const workoutStartTime = useRef(Date.now());

  // Fetch previous workout for progressive overload
  useEffect(() => {
    if (!user?.id || !workoutTitle) return;
    supabase
      .from("workout_logs")
      .select("details")
      .eq("user_id", user.id)
      .eq("workout_name", workoutTitle)
      .eq("completed", true)
      .order("logged_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setPreviousWorkout(data[0]);
      });
  }, [user?.id, workoutTitle]);
  
  const exercise = exercises[currentExerciseIndex];
  const rpeColors = getRPEColor(exercise?.rpe || 5);

  useEffect(() => {
    if (!isRunning) return;
    const baseHR = 72;
    const intensityBoost = exercise.rpe * 8;
    const setBoost = currentSet * 3;
    const interval = setInterval(() => {
      const variation = Math.random() * 10 - 5;
      const targetHR = baseHR + intensityBoost + setBoost + variation;
      setSimulatedHeartRate(Math.round(Math.min(Math.max(targetHR, 65), 185)));
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, exercise.rpe, currentSet]);

  // Pause the stable timer when rest overlay is showing
  useEffect(() => {
    if (showRestTimer || showExerciseRestTimer) {
      pauseTimer();
    } else if (!showRestTimer && !showExerciseRestTimer && !showComplete) {
      resumeTimer();
    }
  }, [showRestTimer, showExerciseRestTimer, showComplete, pauseTimer, resumeTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const playSound = (type: 'confirm' | 'complete') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      if (type === 'confirm') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      }
    } catch (e) {}
  };

  // Helper: find superset group boundaries
  const getGroupBounds = (groupId: string) => {
    let firstGroupIdx = -1;
    let lastGroupIdx = -1;
    for (let i = 0; i < exercises.length; i++) {
      if (exercises[i].groupId === groupId) {
        if (firstGroupIdx === -1) firstGroupIdx = i;
        lastGroupIdx = i;
      }
    }
    return { firstGroupIdx, lastGroupIdx };
  };

  const handleConfirmSet = () => {
    // Track this completed set
    if (!completedSetsRef.current[currentExerciseIndex]) {
      completedSetsRef.current[currentExerciseIndex] = [];
    }
    completedSetsRef.current[currentExerciseIndex].push({
      weight,
      reps: reps || exercise.targetReps,
      isFailure: achievedFailure || false,
    });
    setAchievedFailure(false);

    setShowComplete(true);
    pauseTimer();
    playSound('confirm');

    if (exercise.groupId) {
      // ── SUPERSET STATE MACHINE ──
      const { firstGroupIdx, lastGroupIdx } = getGroupBounds(exercise.groupId);

      if (currentExerciseIndex < lastGroupIdx) {
        // CASE A — Mid-round: advance to next exercise in group, NO rest, keep currentSet
        setTimeout(() => {
          setShowComplete(false);
          setCurrentExerciseIndex(p => p + 1);
          resetTimer();
          setReps(0);
          resumeTimer();
          toast.info("🔗 Süperset: Dinlenmeden sıradaki harekete geç!");
        }, 800);
      } else if (currentExerciseIndex === lastGroupIdx && currentSet < exercise.sets) {
        // CASE B — End of round, more sets remain: REST then loop back to first group exercise
        setTimeout(() => {
          setShowComplete(false);
          setShowRestTimer(true);
          // Rest handler will jump back to firstGroupIdx & increment set
        }, 1000);
      } else {
        // CASE C — End of superset, all sets done
        setExerciseComplete(true);
        playSound('complete');
        setTimeout(() => {
          setShowComplete(false);
          setExerciseComplete(false);
          if (lastGroupIdx + 1 < exercises.length) {
            setShowExerciseRestTimer(true);
          } else {
            saveWorkoutLog();
            setShowWorkoutSummary(true);
            triggerAchievement("workout_complete");
            if (new Date().getHours() < 6) triggerAchievement("early_workout");
            if (visionAIActive) triggerAchievement("vision_ai_workout");
            if (weight >= 100) triggerAchievement("heavy_lift_100kg");
          }
        }, 1500);
      }
    } else {
      // ── STANDARD (non-superset) ──
      if (currentSet >= exercise.sets) {
        setExerciseComplete(true);
        playSound('complete');
        setTimeout(() => {
          setShowComplete(false);
          setExerciseComplete(false);
          if (currentExerciseIndex < exercises.length - 1) {
            setShowExerciseRestTimer(true);
          } else {
            saveWorkoutLog();
            setShowWorkoutSummary(true);
            triggerAchievement("workout_complete");
            if (new Date().getHours() < 6) triggerAchievement("early_workout");
            if (visionAIActive) triggerAchievement("vision_ai_workout");
            if (weight >= 100) triggerAchievement("heavy_lift_100kg");
          }
        }, 1500);
      } else {
        setTimeout(() => { setShowComplete(false); setShowRestTimer(true); }, 1000);
      }
    }
  };

  const calculateTotalTonnage = (): number => {
    let total = 0;
    Object.values(completedSetsRef.current).forEach(sets => {
      sets.forEach(s => { total += s.weight * s.reps; });
    });
    return total;
  };

  const getTotalSetsCompleted = (): number => {
    let total = 0;
    Object.values(completedSetsRef.current).forEach(sets => { total += sets.length; });
    return total;
  };

  const saveWorkoutLog = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    
    const durationMinutes = Math.round((Date.now() - workoutStartTime.current) / 60000);
    const tonnage = calculateTotalTonnage();
    const bioCoinsEarned = 150;

    const details = exercises.map((ex, idx) => {
      const actualSets = completedSetsRef.current[idx] ?? [];

      // Progressive overload: compare max weight with previous session
      let weightDiff: number | null = null;
      if (previousWorkout?.details) {
        const prevDetails = typeof previousWorkout.details === 'string'
          ? JSON.parse(previousWorkout.details)
          : previousWorkout.details;
        if (Array.isArray(prevDetails)) {
          const prevEx = prevDetails.find((p: any) => p.exerciseName === ex.name);
          if (prevEx?.sets?.length > 0 && actualSets.length > 0) {
            const currentMax = Math.max(...actualSets.map(s => Number(s.weight) || 0));
            const prevMax = Math.max(...prevEx.sets.map((s: any) => Number(s.weight) || 0));
            if (prevMax > 0 && currentMax > 0) weightDiff = currentMax - prevMax;
          }
        }
      }

      // RIR success: did they hit target reps on last set?
      let rirSuccess: boolean | null = null;
      if (ex.rir != null && actualSets.length > 0) {
        const lastSet = actualSets[actualSets.length - 1];
        rirSuccess = lastSet.reps >= Number(ex.reps);
      }

      return {
        exerciseName: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        rir: ex.rir ?? null,
        failure_set: ex.failureSet ?? false,
        groupId: ex.groupId ?? null,
        sets: actualSets.map(s => ({ weight: s.weight, reps: s.reps, isFailure: s.isFailure })),
        weightDiff,
        rirSuccess,
      };
    });

    try {
      const { error } = await supabase.from("workout_logs").insert({
        user_id: user.id,
        workout_name: workoutTitle,
        duration_minutes: durationMinutes,
        tonnage,
        exercises_count: exercises.length,
        bio_coins_earned: bioCoinsEarned,
        completed: true,
        details,
      });

      if (error) throw error;

      // Award bio coins to profile
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("bio_coins")
        .eq("id", user.id)
        .single();

      if (currentProfile) {
        await supabase
          .from("profiles")
          .update({ bio_coins: (currentProfile.bio_coins ?? 0) + bioCoinsEarned })
          .eq("id", user.id);
      }

      // Log transaction
      await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount: bioCoinsEarned,
        type: "workout",
        description: `${workoutTitle} tamamlandı`,
      });

      // Mark assignment as completed
      if (assignmentId) {
        await supabase
          .from("assigned_workouts")
          .update({ status: "completed" })
          .eq("id", assignmentId);
      }

      toast.success("Antrenman başarıyla kaydedildi! +150 Bio-Coin kazandın.");
    } catch (err: any) {
      console.error("Workout log save error:", err.message);
      toast.error("Antrenman kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false); resetTimer(); setReps(0); setAchievedFailure(false);
    if (exercise.groupId) {
      const { firstGroupIdx } = getGroupBounds(exercise.groupId);
      setCurrentExerciseIndex(firstGroupIdx);
      setCurrentSet(p => p + 1);
    } else {
      setCurrentSet(p => p + 1);
    }
    resumeTimer();
  };
  const handleSkipRest = () => {
    setShowRestTimer(false); resetTimer(); setReps(0); setAchievedFailure(false);
    if (exercise.groupId) {
      const { firstGroupIdx } = getGroupBounds(exercise.groupId);
      setCurrentExerciseIndex(firstGroupIdx);
      setCurrentSet(p => p + 1);
    } else {
      setCurrentSet(p => p + 1);
    }
    resumeTimer();
  };
  const handleExerciseRestComplete = () => {
    setShowExerciseRestTimer(false); resetTimer(); setReps(0); setWeight(60); setCurrentSet(1); setAchievedFailure(false);
    if (exercise.groupId) {
      const { lastGroupIdx } = getGroupBounds(exercise.groupId);
      setCurrentExerciseIndex(lastGroupIdx + 1);
    } else {
      setCurrentExerciseIndex(p => p + 1);
    }
    resumeTimer();
  };
  const handleExerciseRestSkip = () => {
    setShowExerciseRestTimer(false); resetTimer(); setReps(0); setWeight(60); setCurrentSet(1); setAchievedFailure(false);
    if (exercise.groupId) {
      const { lastGroupIdx } = getGroupBounds(exercise.groupId);
      setCurrentExerciseIndex(lastGroupIdx + 1);
    } else {
      setCurrentExerciseIndex(p => p + 1);
    }
    resumeTimer();
  };

  const handleSwipeEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold || info.velocity.x < -300) {
      if (currentExerciseIndex < exercises.length - 1) { hapticMedium(); setSwipeDirection('left'); goToExercise(currentExerciseIndex + 1); }
    } else if (info.offset.x > threshold || info.velocity.x > 300) {
      if (currentExerciseIndex > 0) { hapticMedium(); setSwipeDirection('right'); goToExercise(currentExerciseIndex - 1); }
    }
  };

  const goToExercise = (index: number) => {
    setCurrentExerciseIndex(index); setCurrentSet(1); resetTimer(); setReps(0); setWeight(60); resumeTimer(); setAchievedFailure(false);
    setTimeout(() => setSwipeDirection(null), 300);
  };

  const handlePrevExercise = () => { if (currentExerciseIndex > 0) { hapticLight(); setSwipeDirection('right'); goToExercise(currentExerciseIndex - 1); } };
  const handleNextExercise = () => { if (currentExerciseIndex < exercises.length - 1) { hapticLight(); setSwipeDirection('left'); goToExercise(currentExerciseIndex + 1); } };

  // Compute the correct "next exercise" for UI previews (superset-aware)
  let computedNextExercise: typeof exercises[number] | undefined = exercises[currentExerciseIndex + 1];
  const currentEx = exercises[currentExerciseIndex];
  if (currentEx) {
    if (currentEx.groupId) {
      const { firstGroupIdx, lastGroupIdx } = getGroupBounds(currentEx.groupId);
      if (currentExerciseIndex < lastGroupIdx) {
        computedNextExercise = exercises[currentExerciseIndex + 1];
      } else if (currentExerciseIndex === lastGroupIdx && currentSet < currentEx.sets) {
        computedNextExercise = exercises[firstGroupIdx];
      } else if (currentExerciseIndex === lastGroupIdx && currentSet >= currentEx.sets) {
        computedNextExercise = exercises[lastGroupIdx + 1];
      }
    } else {
      if (currentSet < currentEx.sets) {
        computedNextExercise = currentEx;
      } else {
        computedNextExercise = exercises[currentExerciseIndex + 1];
      }
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden touch-none">
        {/* Complete Flash */}
        <AnimatePresence>
          {showComplete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 z-50 flex items-center justify-center ${exerciseComplete ? 'bg-primary/50' : 'bg-primary/30'}`}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: exerciseComplete ? [0, 1.2, 1] : 1 }} transition={{ duration: exerciseComplete ? 0.5 : 0.3 }} className={`rounded-full flex items-center justify-center ${exerciseComplete ? 'w-32 h-32 bg-primary neon-glow' : 'w-24 h-24 bg-primary'}`}>
                {exerciseComplete ? <Trophy className="w-16 h-16 text-primary-foreground" /> : <Check className="w-12 h-12 text-primary-foreground" />}
              </motion.div>
              {exerciseComplete && <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="absolute bottom-1/3 font-display text-xl text-foreground tracking-wider">HAREKET TAMAMLANDI!</motion.p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Workout Summary */}
        <AnimatePresence>
          {showWorkoutSummary && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="w-24 h-24 rounded-full bg-primary neon-glow flex items-center justify-center mb-6">
                <Trophy className="w-12 h-12 text-primary-foreground" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display text-3xl text-foreground mb-2">ANTRENMAN TAMAMLANDI!</motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-muted-foreground text-center mb-8">Harika iş çıkardın! Tüm hareketleri başarıyla tamamladın.</motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 w-full max-w-sm space-y-4 mb-4">
                <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm">Toplam Hareket</span><span className="font-display text-lg text-foreground">{exercises.length}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm">Toplam Set</span><span className="font-display text-lg text-foreground">{getTotalSetsCompleted()}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm">Süre</span><span className="font-display text-lg text-foreground">{Math.round((Date.now() - workoutStartTime.current) / 60000)} dk</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm">Tonnaj</span><span className="font-display text-lg text-foreground">{calculateTotalTonnage() >= 1000 ? `${(calculateTotalTonnage() / 1000).toFixed(1)} Ton` : `${calculateTotalTonnage()} kg`}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground text-sm">Kazanılan Bio-Coin</span><span className="font-display text-lg text-primary">+150</span></div>
              </motion.div>

              {/* Hypertrophy Analytics */}
              {(() => {
                const failureCount = exercises.filter(e => e.failureSet).length;
                const rirCount = exercises.filter(e => typeof e.rir === 'number').length;
                const supersetGroupIds = new Set(exercises.filter(e => e.groupId).map(e => e.groupId));
                const supersetCount = supersetGroupIds.size;
                const hasAny = failureCount > 0 || rirCount > 0 || supersetCount > 0;
                if (!hasAny) return null;
                return (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full max-w-sm mb-4">
                    <p className="text-[10px] font-display text-muted-foreground tracking-widest uppercase text-center mb-2">Hipertrofi Analizi</p>
                    <div className="space-y-2">
                      {failureCount > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                          <span className="text-lg">🔥</span>
                          <div className="flex-1">
                            <p className="font-display text-sm text-foreground">{failureCount} Tükeniş Seti</p>
                            <p className="text-[10px] text-muted-foreground">Maksimum kas lifi aktive edildi</p>
                          </div>
                          <span className="font-display text-lg text-destructive">{failureCount}</span>
                        </div>
                      )}
                      {rirCount > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                          <span className="text-lg">🎯</span>
                          <div className="flex-1">
                            <p className="font-display text-sm text-foreground">{rirCount} RIR Hedefli Set</p>
                            <p className="text-[10px] text-muted-foreground">Hassas yoğunluk kontrolü</p>
                          </div>
                          <span className="font-display text-lg text-primary">{rirCount}</span>
                        </div>
                      )}
                      {supersetCount > 0 && (
                        <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                          <span className="text-lg">🔗</span>
                          <div className="flex-1">
                            <p className="font-display text-sm text-foreground">{supersetCount} Süperset</p>
                            <p className="text-[10px] text-muted-foreground">Metabolik stres artırıldı</p>
                          </div>
                          <span className="font-display text-lg text-accent-foreground">{supersetCount}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}

              {/* Progressive Overload per Exercise */}
              {(() => {
                if (!previousWorkout?.details) return null;
                const prevDetails = typeof previousWorkout.details === 'string'
                  ? JSON.parse(previousWorkout.details)
                  : previousWorkout.details;
                if (!Array.isArray(prevDetails)) return null;

                const overloadItems = exercises.map((ex, idx) => {
                  const actualSets = completedSetsRef.current[idx] ?? [];
                  if (actualSets.length === 0) return null;
                  const prevEx = prevDetails.find((p: any) => p.exerciseName === ex.name);
                  if (!prevEx?.sets?.length) return null;
                  const currentMax = Math.max(...actualSets.map(s => Number(s.weight) || 0));
                  const prevMax = Math.max(...prevEx.sets.map((s: any) => Number(s.weight) || 0));
                  if (prevMax <= 0 || currentMax <= 0) return null;
                  const diff = currentMax - prevMax;
                  if (diff === 0) return null;
                  return { name: ex.name, diff, currentMax, prevMax };
                }).filter(Boolean) as { name: string; diff: number; currentMax: number; prevMax: number }[];

                if (overloadItems.length === 0) return null;

                return (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="w-full max-w-sm mb-4">
                    <p className="text-[10px] font-display text-muted-foreground tracking-widest uppercase text-center mb-2">Progressive Overload</p>
                    <div className="space-y-2">
                      {overloadItems.map((item) => (
                        <div key={item.name} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                          item.diff > 0
                            ? 'border-green-500/20 bg-green-500/5'
                            : 'border-destructive/20 bg-destructive/5'
                        }`}>
                          <span className="text-lg">{item.diff > 0 ? '📈' : '📉'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-sm text-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.prevMax}kg → {item.currentMax}kg</p>
                          </div>
                          <span className={`font-display text-sm px-2 py-0.5 rounded-full ${
                            item.diff > 0
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {item.diff > 0 ? '+' : ''}{item.diff}kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}
              <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileTap={{ scale: 0.98 }} onClick={onClose} disabled={isSaving} className="w-full max-w-sm py-4 bg-primary text-primary-foreground font-display text-lg tracking-wider rounded-xl neon-glow disabled:opacity-50">{isSaving ? "KAYDEDİLİYOR..." : "ANTRENMANI BİTİR"}</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-primary" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="font-display text-sm text-foreground tracking-wider">GÖREV KONTROL: CANLI</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.button onClick={() => setShowHeartRateInfo(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30" animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.8, repeat: Infinity }} whileTap={{ scale: 0.95 }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /></motion.div>
              <span className="font-display text-sm text-red-400 tabular-nums min-w-[32px]">{simulatedHeartRate}</span>
              <span className="text-[10px] text-red-400/70">bpm</span>
              <Info className="w-3 h-3 text-red-400/50 ml-0.5" />
            </motion.button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        </div>

        {/* Exercise Progress Dots */}
        <div className="flex-shrink-0 flex items-center justify-center gap-1 py-2 bg-card/50">
          {exercises.map((ex, index) => {
            const isGrouped = !!ex.groupId;
            const isFirstInGroup = isGrouped && (index === 0 || exercises[index - 1].groupId !== ex.groupId);
            const isLastInGroup = isGrouped && (index === exercises.length - 1 || exercises[index + 1].groupId !== ex.groupId);
            const isCurrent = index === currentExerciseIndex;
            const isDone = index < currentExerciseIndex;

            return (
              <div key={index} className="flex items-center">
                {isFirstInGroup && (
                  <div className="flex items-center mr-0.5">
                    <div className="w-px h-3 bg-primary/40 rounded-full" />
                  </div>
                )}
                <motion.button
                  onClick={() => { hapticLight(); setSwipeDirection(index > currentExerciseIndex ? 'left' : 'right'); goToExercise(index); }}
                  className={`h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? isGrouped ? 'w-6 bg-primary ring-1 ring-primary/30 ring-offset-1 ring-offset-card' : 'w-6 bg-primary'
                      : isDone
                        ? isGrouped ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-primary/50'
                        : isGrouped ? 'w-1.5 bg-primary/25' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
                {isGrouped && !isLastInGroup && exercises[index + 1].groupId === ex.groupId && (
                  <div className="w-2 h-[2px] bg-primary/30 rounded-full" />
                )}
                {isLastInGroup && (
                  <div className="flex items-center ml-0.5">
                    <div className="w-px h-3 bg-primary/40 rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Vision Area */}
        <motion.div className="h-[55%] relative bg-black overflow-hidden touch-pan-y" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleSwipeEnd}>
          <AnimatePresence>
            {currentExerciseIndex > 0 && (
              <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 0.6, x: 0 }} exit={{ opacity: 0, x: -10 }} onClick={handlePrevExercise} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10"><ChevronLeft className="w-5 h-5 text-foreground" /></motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {currentExerciseIndex < exercises.length - 1 && (
              <motion.button initial={{ opacity: 0, x: 10 }} animate={{ opacity: 0.6, x: 0 }} exit={{ opacity: 0, x: 10 }} onClick={handleNextExercise} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10"><ChevronRight className="w-5 h-5 text-foreground" /></motion.button>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 flex items-center justify-center">
            {!visionAIActive ? (
              <div className="relative w-full h-full">
                {exercise?.videoUrl ? (
                  <motion.div key={exercise.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                    <img src={exercise.videoUrl} alt={exercise.name} className="w-full h-full object-contain opacity-80 mix-blend-screen" loading="lazy" decoding="async" crossOrigin="anonymous" onError={(e) => { const img = e.currentTarget as HTMLImageElement; img.src = '/placeholder.svg'; img.className = 'w-1/2 h-1/2 mx-auto my-auto opacity-40 object-contain'; }} />
                  </motion.div>
                ) : (
                  <motion.div className="absolute inset-0 flex items-center justify-center bg-secondary/20" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="text-center">
                      <motion.div className="w-24 h-24 mx-auto mb-3 rounded-full bg-secondary/50 border border-white/10 flex items-center justify-center" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Play className="w-10 h-10 text-primary ml-1" />
                      </motion.div>
                      <p className="font-display text-foreground text-sm mb-1">{exercise?.name}</p>
                      <p className="text-muted-foreground text-xs">GIF yükleniyor...</p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid meet">
                  <g stroke="hsl(var(--primary))" strokeWidth="2" fill="none" className="drop-shadow-[0_0_10px_hsl(var(--primary))]">
                    <circle cx="100" cy="40" r="15" /><line x1="100" y1="55" x2="100" y2="130" /><line x1="60" y1="70" x2="140" y2="70" />
                    <line x1="60" y1="70" x2="45" y2="110" /><line x1="45" y1="110" x2="35" y2="150" /><line x1="140" y1="70" x2="155" y2="110" />
                    <line x1="155" y1="110" x2="165" y2="150" /><line x1="75" y1="130" x2="125" y2="130" /><line x1="75" y1="130" x2="65" y2="190" />
                    <line x1="65" y1="190" x2="60" y2="260" /><line x1="125" y1="130" x2="135" y2="190" /><line x1="135" y1="190" x2="140" y2="260" />
                    {[[60,70],[140,70],[45,110],[155,110],[75,130],[125,130],[65,190],[135,190]].map(([cx,cy],i) => (
                      <circle key={i} cx={cx} cy={cy} r="4" fill="hsl(var(--primary))" />
                    ))}
                  </g>
                </svg>
              </>
            )}
          </div>

          {/* Vision AI Stats */}
          <AnimatePresence>
            {visionAIActive && (
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="absolute top-3 left-3 flex gap-2">
                <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 mb-0.5"><Activity className="w-3 h-3 text-primary" /><span className="text-[9px] text-muted-foreground uppercase">ROM</span></div>
                  <p className="font-display text-base text-primary leading-none">98%</p>
                </div>
                <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5 mb-0.5"><Target className="w-3 h-3 text-orange-400" /><span className="text-[9px] text-muted-foreground uppercase">Hız</span></div>
                  <p className="font-display text-base text-orange-400 leading-none">0.45</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Right Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} onClick={() => setVisionAIActive(!visionAIActive)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${visionAIActive ? "bg-primary/20 border-primary/50 text-primary" : "bg-black/60 border-white/10 text-muted-foreground hover:border-primary/30"}`}>
              {visionAIActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="text-[9px] font-display tracking-wider">{visionAIActive ? "AI ON" : "AI"}</span>
            </motion.button>
            <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1.5 text-center">
              <span className="text-[9px] text-muted-foreground uppercase block">Set</span>
              <p className="font-display text-base text-foreground leading-none">{currentSet}/{exercise.sets}</p>
            </div>
            {exercise.groupId && (() => {
              const { firstGroupIdx, lastGroupIdx } = getGroupBounds(exercise.groupId);
              const groupSize = lastGroupIdx - firstGroupIdx + 1;
              const posInGroup = currentExerciseIndex - firstGroupIdx + 1;
              return (
                <div className="bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-lg px-2.5 py-1.5 text-center">
                  <span className="text-[9px] text-primary uppercase block tracking-wider">Süperset</span>
                  <p className="font-display text-base text-primary leading-none">{posInGroup}/{groupSize}</p>
                  <span className="text-[8px] text-primary/60 block">Tur {currentSet}/{exercise.sets}</span>
                </div>
              );
            })()}
          </div>
        </motion.div>

        {/* Info Panel */}
        <div className="h-[45%] bg-card border-t border-white/10 flex flex-col overflow-hidden">
          <div className="flex-1 p-3 space-y-2 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg text-foreground tracking-wider leading-tight">{exercise.name}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-[10px]">{workoutTitle}</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowExerciseHistory(true)} className="p-2 rounded-lg bg-secondary/50 border border-primary/30 hover:bg-primary/10 transition-colors">
                <History className="w-4 h-4 text-primary" />
              </motion.button>
            </div>

            <div className="flex gap-2">
              <div className={`flex-1 ${rpeColors.bg} ${rpeColors.border} border rounded-xl px-3 py-2`}>
                <div className="flex items-center gap-2">
                  <Target className={`w-4 h-4 ${rpeColors.text}`} />
                  <div className="flex-1">
                    <span className="text-[9px] text-muted-foreground block">HEDEF RPE</span>
                    <span className={`font-display text-lg ${rpeColors.text} leading-none`}>{exercise.rpe}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[9px] text-primary tracking-wider">KOÇ HEDEFİ</span>
                </div>
                <p className="text-primary font-display text-sm leading-tight">
                  {exercise.reps}x @ {exercise.failureSet 
                    ? 'FAILURE' 
                    : (exercise.rirPerSet && exercise.rirPerSet.length > 0) 
                      ? exercise.rirPerSet.join('-') + ' RIR'
                      : typeof exercise.rir === 'number' 
                        ? Array(Number(exercise.sets) || 1).fill(exercise.rir).join('-') + ' RIR'
                        : exercise.tempo}
                </p>
              </div>
            </div>

            {exercise.failureSet && (
              <button
                onClick={() => setAchievedFailure(!achievedFailure)}
                className={`w-full py-3 rounded-xl font-bold tracking-wide transition-all duration-300 border backdrop-blur-md flex items-center justify-center gap-2 mt-2 mb-1 ${achievedFailure ? 'bg-red-500/30 border-red-400/60 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.35),inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-red-950/40 border-red-800/30 text-red-400/80 hover:bg-red-900/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'}`}
              >
                🔥 TÜKENİŞE ULAŞTIM
              </button>
            )}

            {exercise.notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-2 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-100 text-[11px] leading-snug line-clamp-2">{exercise.notes}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 p-3 pt-2 border-t border-white/5 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center">
                <p className="text-muted-foreground text-[9px] mb-1">KG</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-display text-base">-</button>
                  <div className="w-12 text-center"><p className="font-display text-xl text-foreground leading-none">{weight}</p></div>
                  <button onClick={() => setWeight(w => w + 2.5)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-display text-base">+</button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-muted-foreground text-[9px] mb-1">SÜRE</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setIsRunning(!isRunning)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                    {isRunning ? <Pause className="w-3 h-3 text-foreground" /> : <Play className="w-3 h-3 text-foreground" />}
                  </button>
                  <p className="font-display text-base text-foreground tracking-wider">{formatTime(timer)}</p>
                  <button onClick={() => setTimer(0)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><RotateCcw className="w-3 h-3 text-muted-foreground" /></button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-muted-foreground text-[9px] mb-1">TEKRAR</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setReps(r => Math.max(0, r - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-display text-base">-</button>
                  <div className="w-12 text-center"><p className="font-display text-xl text-foreground leading-none">{reps}</p></div>
                  <button onClick={() => setReps(r => r + 1)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-display text-base">+</button>
                </div>
              </div>
            </div>
            {(() => {
              let prevMax = 0;
              if (previousWorkout?.details) {
                const prevDetails = typeof previousWorkout.details === 'string' ? JSON.parse(previousWorkout.details) : previousWorkout.details;
                if (Array.isArray(prevDetails)) {
                  const prevEx = prevDetails.find((p: any) => p.exerciseName === exercise.name);
                  if (prevEx?.sets?.length > 0) {
                    prevMax = Math.max(...prevEx.sets.map((s: any) => Number(s.weight) || 0));
                  }
                }
              }
              return prevMax > 0 ? (
                <div className="text-center">
                  <span className={`text-xs px-2 py-1 rounded-full border backdrop-blur-sm transition-colors ${weight > prevMax ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                    Geçmiş Rekor: {prevMax} kg {weight > prevMax && `(🚀 +${weight - prevMax} kg)`}
                  </span>
                </div>
              ) : null;
            })()}
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleConfirmSet} disabled={reps === 0} className="w-full py-3.5 bg-primary text-primary-foreground font-display text-base tracking-wider rounded-xl neon-glow disabled:opacity-50 disabled:cursor-not-allowed">SETİ ONAYLA</motion.button>
          </div>
        </div>

        {/* RPE Info Modal */}
        <AnimatePresence>
          {showRpeInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRpeInfo(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card border border-white/10 rounded-2xl p-4 max-w-xs w-full">
                <div className="flex items-center justify-between mb-4"><h3 className="font-display text-lg text-foreground">RPE NEDİR?</h3><button onClick={() => setShowRpeInfo(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button></div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">RPE (Rate of Perceived Exertion), algılanan efor seviyesidir. 1-10 skalasında ölçülür.</p>
                <div className="space-y-2">
                  {[{range:"1-5",label:"Kolay - Orta",desc:"Isınma ve düşük yoğunluk",color:"green"},{range:"6-7",label:"Zorlu",desc:"2-3 tekrar daha yapabilirsin",color:"yellow"},{range:"8-9",label:"Çok Zorlu",desc:"1 tekrar daha yapabilirsin",color:"orange"},{range:"10",label:"Maksimum",desc:"Başarısızlığa kadar",color:"red"}].map(item => (
                    <div key={item.range} className={`flex items-center gap-3 p-2 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/30`}>
                      <span className={`font-display text-lg text-${item.color}-400 w-8`}>{item.range}</span>
                      <div><p className={`text-${item.color}-400 text-xs font-medium`}>{item.label}</p><p className="text-muted-foreground text-[10px]">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heart Rate Info Modal */}
        <AnimatePresence>
          {showHeartRateInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowHeartRateInfo(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-card border border-white/10 rounded-2xl p-4 max-w-xs w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-400 fill-red-400" /><h3 className="font-display text-lg text-foreground">NABIZ REHBERİ</h3></div>
                  <button onClick={() => setShowHeartRateInfo(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 mb-4">
                  <p className="text-muted-foreground text-xs mb-1">Yaşa Göre Max Nabız (220 - Yaş)</p>
                  <p className="text-foreground font-display text-xl">192 bpm</p>
                  <p className="text-muted-foreground text-[10px]">28 yaş için hesaplanmış</p>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">İdeal nabız aralığı antrenman tipine göre değişir:</p>
                <div className="space-y-2">
                  {[{range:"96-115",label:"Isınma (%50-60)",desc:"Düşük yoğunluk",color:"blue"},{range:"115-134",label:"Yağ Yakımı (%60-70)",desc:"Orta yoğunluk",color:"green"},{range:"134-154",label:"Kardio (%70-80)",desc:"Yüksek yoğunluk",color:"yellow"},{range:"154-173",label:"Anaerobik (%80-90)",desc:"Çok yüksek yoğunluk",color:"orange"},{range:"173-192",label:"Maksimum (%90-100)",desc:"Tüm güç",color:"red"}].map(item => (
                    <div key={item.range} className={`flex items-center gap-3 p-2 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/30`}>
                      <div className="text-center w-20"><span className={`font-display text-sm text-${item.color}-400`}>{item.range}</span><p className={`text-[9px] text-${item.color}-400/70`}>bpm</p></div>
                      <div><p className={`text-${item.color}-400 text-xs font-medium`}>{item.label}</p><p className="text-muted-foreground text-[10px]">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-2 bg-primary/10 border border-primary/30 rounded-lg"><p className="text-primary text-[10px] text-center">💡 Kuvvet antrenmanında nabız 120-160 bpm aralığında optimal performans sağlar</p></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Rest Timer Overlay (between sets) */}
      {showRestTimer && (
        <RestTimerOverlay
          isOpen={showRestTimer}
          onClose={() => { setShowRestTimer(false); handleRestComplete(); }}
          initialSeconds={exercise.restDuration}
          exerciseName={exercise.name}
          nextExercise={computedNextExercise?.name}
        />
      )}

      {/* Exercise Rest Timer Overlay (between exercises) */}
      {showExerciseRestTimer && currentExerciseIndex < exercises.length - 1 && (
        <ExerciseRestTimerOverlay
          duration={90}
          onComplete={handleExerciseRestComplete}
          onSkip={handleExerciseRestSkip}
          completedExerciseName={exercise.name}
          nextExerciseName={computedNextExercise?.name ?? "—"}
          nextExerciseSets={computedNextExercise?.sets ?? 0}
          nextExerciseReps={computedNextExercise?.targetReps ?? 0}
          currentExerciseNumber={currentExerciseIndex + 1}
          totalExercises={exercises.length}
        />
      )}

      <ExerciseHistoryModal exerciseName={exercise.name} isOpen={showExerciseHistory} onClose={() => setShowExerciseHistory(false)} />
    </>
  );
};

export default VisionAIExecution;
