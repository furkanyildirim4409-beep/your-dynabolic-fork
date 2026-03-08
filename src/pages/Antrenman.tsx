import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, ChevronRight, Clock, Flame, Play, X, CheckCircle2, Timer, RotateCcw, CalendarDays, List, History, ChevronDown, ChevronUp, TrendingUp, Target, Trophy } from "lucide-react";
import { assignedWorkouts, detailedExercises, workoutHistory } from "@/lib/mockData";
import WorkoutCard from "@/components/WorkoutCard";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import VisionAIExecution from "@/components/VisionAIExecution";
import ExerciseGoalsSection from "@/components/ExerciseGoalsSection";
import PersonalRecords from "@/components/PersonalRecords";
import { Button } from "@/components/ui/button";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";

type ViewMode = "list" | "calendar";

const Antrenman = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showVisionAI, setShowVisionAI] = useState(false);
  const [showPRs, setShowPRs] = useState(false);

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const workout = selectedWorkout ? assignedWorkouts.find(w => w.id === selectedWorkout) : null;
  const exercises = workout ? detailedExercises.filter(e => e.category === workout.categoryFilter) : [];

  const toggleSet = (exerciseId: string, setIndex: number) => {
    hapticLight();
    setCompletedSets(prev => {
      const key = exerciseId;
      const current = prev[key] || Array(5).fill(false);
      const updated = [...current];
      updated[setIndex] = !updated[setIndex];
      return { ...prev, [key]: updated };
    });
  };

  const handleStartVisionAI = (workoutId: string) => {
    hapticMedium();
    setSelectedWorkout(workoutId);
    setShowVisionAI(true);
  };

  const handleCompleteWorkout = () => {
    hapticSuccess();
    toast({ title: "Antrenman Tamamlandı! 💪", description: "Harika iş çıkardın, veriler kaydedildi." });
    setShowVisionAI(false);
    setSelectedWorkout(null);
    setActiveSession(null);
    setCompletedSets({});
  };

  const totalCompletedToday = useMemo(() => {
    return Object.values(completedSets).reduce((sum, sets) => sum + sets.filter(Boolean).length, 0);
  }, [completedSets]);

  const totalSetsToday = exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <h1 className="font-display text-xl font-bold text-foreground">ANTRENMAN</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { hapticLight(); setShowPRs(!showPRs); }} className="p-2 rounded-full bg-secondary/50 border border-border">
              <Trophy className="w-4 h-4 text-yellow-500" />
            </button>
            <button onClick={() => { hapticLight(); setShowHistory(true); }} className="p-2 rounded-full bg-secondary/50 border border-border">
              <History className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Arnold Split • Hafta 4</p>
      </motion.div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        <button
          onClick={() => { hapticLight(); setViewMode("list"); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-display transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          <List className="w-3.5 h-3.5" /> Liste
        </button>
        <button
          onClick={() => { hapticLight(); setViewMode("calendar"); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-display transition-all ${viewMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Takvim
        </button>
      </div>

      {/* Personal Records */}
      <AnimatePresence>
        {showPRs && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <PersonalRecords isOpen={showPRs} onClose={() => setShowPRs(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise Goals */}
      <ExerciseGoalsSection />

      {/* Content */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {assignedWorkouts.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={i === todayIndex ? "ring-1 ring-primary/50 rounded-xl" : ""}>
                {i === todayIndex && (
                  <div className="flex items-center gap-1 px-3 pt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary text-[10px] font-display tracking-wider">BUGÜNKÜ ANTRENMAN</span>
                  </div>
                )}
                <WorkoutCard
                  title={w.title}
                  day={w.day}
                  exercises={w.exercises}
                  duration={w.duration}
                  intensity={w.intensity}
                  coachNote={w.coachNote}
                  onStart={() => handleStartVisionAI(w.id)}
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <WorkoutCalendar />
      )}

      {/* Workout Detail Overlay (traditional mode) */}
      <AnimatePresence>
        {selectedWorkout && workout && !showVisionAI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
            <div className="max-w-[430px] mx-auto p-4 pb-32">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg text-foreground">{workout.title}</h2>
                  <p className="text-muted-foreground text-xs">{workout.day} • {workout.duration}</p>
                </div>
                <button onClick={() => { setSelectedWorkout(null); setActiveSession(null); setCompletedSets({}); }} className="p-2 rounded-full bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {workout.coachNote && (
                <div className="glass-card p-3 mb-4 border-l-2 border-l-primary">
                  <p className="text-xs text-muted-foreground">💬 Koç notu: <span className="text-foreground">{workout.coachNote}</span></p>
                </div>
              )}

              {/* Progress indicator */}
              {activeSession && totalSetsToday > 0 && (
                <div className="glass-card p-3 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /><span className="text-foreground text-sm font-display">İlerleme</span></div>
                    <span className="text-primary text-sm font-display">{totalCompletedToday}/{totalSetsToday}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${(totalCompletedToday / totalSetsToday) * 100}%` }} />
                  </div>
                </div>
              )}

              {!activeSession ? (
                <div className="flex gap-2 mb-6">
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setActiveSession(workout.id)} className="flex-1 bg-primary text-primary-foreground py-4 rounded-xl font-display text-sm flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" /> KLASİK MOD
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowVisionAI(true)} className="flex-1 bg-card border border-primary text-primary py-4 rounded-xl font-display text-sm flex items-center justify-center gap-2">
                    <Dumbbell className="w-5 h-5" /> AI MOD
                  </motion.button>
                </div>
              ) : (
                <div className="glass-card p-3 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-primary" /><span className="text-foreground text-sm font-display">Aktif Oturum</span></div>
                  <span className="text-primary text-sm font-mono">00:00</span>
                </div>
              )}

              <div className="space-y-3">
                {exercises.map((exercise, i) => {
                  const sets = completedSets[exercise.id] || Array(exercise.sets).fill(false);
                  const completedCount = sets.filter(Boolean).length;
                  const isExpanded = expandedExercise === exercise.id;
                  return (
                    <motion.div key={exercise.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
                      {/* Exercise header */}
                      <button onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)} className="w-full p-4 flex items-center justify-between text-left">
                        <div className="flex-1">
                          <h3 className="font-display text-sm text-foreground">{exercise.name}</h3>
                          <p className="text-muted-foreground text-xs">{exercise.sets}x{exercise.targetReps} • RPE {exercise.rpe} • Tempo: {exercise.tempo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {completedCount > 0 && <span className="text-xs text-primary font-display">{completedCount}/{exercise.sets}</span>}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-3">
                              {exercise.notes && <p className="text-muted-foreground text-[10px] italic">💡 {exercise.notes}</p>}

                              {/* Previous performance */}
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                                <TrendingUp className="w-3 h-3 text-emerald-400" />
                                <span className="text-muted-foreground text-[10px]">Önceki: {exercise.sets}x{exercise.targetReps}</span>
                              </div>

                              {/* Set tracking */}
                              {activeSession && (
                                <div className="flex gap-2">
                                  {Array.from({ length: exercise.sets }).map((_, si) => (
                                    <button key={si} onClick={() => toggleSet(exercise.id, si)} className={`flex-1 py-2.5 rounded-lg text-xs font-display transition-all ${sets[si] ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-border"}`}>
                                      {sets[si] ? <CheckCircle2 className="w-4 h-4 mx-auto" /> : `Set ${si + 1}`}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {exercise.restDuration > 0 && <p className="text-muted-foreground text-[10px]">⏱ Dinlenme: {exercise.restDuration}sn</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vision AI Execution */}
      {showVisionAI && workout && (
        <VisionAIExecution
          workoutTitle={workout.title}
          onClose={() => { setShowVisionAI(false); setSelectedWorkout(null); }}
        />
      )}

      {/* Workout History Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
            <div className="max-w-[430px] mx-auto p-4 pb-32">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg text-foreground">ANTRENMAN GEÇMİŞİ</h2>
                  <p className="text-muted-foreground text-xs">{workoutHistory.length} antrenman kaydı</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 rounded-full bg-secondary"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="glass-card p-3 text-center">
                  <p className="font-display text-lg text-foreground">{workoutHistory.length}</p>
                  <p className="text-muted-foreground text-[9px]">ANTRENMAN</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="font-display text-lg text-primary">{workoutHistory.reduce((s, w) => s + parseInt(w.tonnage || "0"), 0).toLocaleString()}kg</p>
                  <p className="text-muted-foreground text-[9px]">TOPLAM TONAJ</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="font-display text-lg text-yellow-500">{workoutHistory.reduce((s, w) => s + (w.bioCoins || 0), 0)}</p>
                  <p className="text-muted-foreground text-[9px]">COİN</p>
                </div>
              </div>

              <div className="space-y-2">
                {workoutHistory.map((w, i) => (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{w.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-muted-foreground text-xs">{w.date}</span>
                          <span className="text-muted-foreground text-[10px]">•</span>
                          <span className="text-muted-foreground text-xs flex items-center gap-0.5"><Clock className="w-3 h-3" />{w.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary text-xs font-display">{w.tonnage}</p>
                      <p className="text-yellow-500 text-[10px]">+{w.bioCoins} coin</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Antrenman;
