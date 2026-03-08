import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, ChevronRight, Clock, Flame, Play, X, CheckCircle2, Timer, RotateCcw } from "lucide-react";
import { assignedWorkouts, detailedExercises } from "@/lib/mockData";
import WorkoutCard from "@/components/WorkoutCard";

const Antrenman = () => {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});

  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const workout = selectedWorkout ? assignedWorkouts.find(w => w.id === selectedWorkout) : null;
  const exercises = workout ? detailedExercises.filter(e => e.category === workout.categoryFilter) : [];

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setCompletedSets(prev => {
      const key = exerciseId;
      const current = prev[key] || Array(5).fill(false);
      const updated = [...current];
      updated[setIndex] = !updated[setIndex];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">ANTRENMAN</h1>
        </div>
        <p className="text-muted-foreground text-xs">Arnold Split • Hafta 4</p>
      </motion.div>

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
                onStart={() => setSelectedWorkout(w.id)}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedWorkout && workout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto">
            <div className="max-w-[430px] mx-auto p-4 pb-32">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-lg text-foreground">{workout.title}</h2>
                  <p className="text-muted-foreground text-xs">{workout.day} • {workout.duration}</p>
                </div>
                <button onClick={() => { setSelectedWorkout(null); setActiveSession(null); setCompletedSets({}); }} className="p-2 rounded-full bg-white/5">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {workout.coachNote && (
                <div className="glass-card p-3 mb-4 border-l-2 border-l-primary">
                  <p className="text-xs text-muted-foreground">💬 Koç notu: <span className="text-foreground">{workout.coachNote}</span></p>
                </div>
              )}

              {!activeSession ? (
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setActiveSession(workout.id)} className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-display text-sm flex items-center justify-center gap-2 mb-6">
                  <Play className="w-5 h-5" /> ANTRENMANA BAŞLA
                </motion.button>
              ) : (
                <div className="glass-card p-3 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-primary" /><span className="text-foreground text-sm font-display">Aktif Oturum</span></div>
                  <span className="text-primary text-sm font-mono">00:00</span>
                </div>
              )}

              <div className="space-y-4">
                {exercises.map((exercise, i) => {
                  const sets = completedSets[exercise.id] || Array(exercise.sets).fill(false);
                  const completedCount = sets.filter(Boolean).length;
                  return (
                    <motion.div key={exercise.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-display text-sm text-foreground">{exercise.name}</h3>
                          <p className="text-muted-foreground text-xs">{exercise.sets}x{exercise.targetReps} • RPE {exercise.rpe} • Tempo: {exercise.tempo}</p>
                        </div>
                        <span className="text-xs text-primary">{completedCount}/{exercise.sets}</span>
                      </div>
                      {exercise.notes && <p className="text-muted-foreground text-[10px] mb-3 italic">💡 {exercise.notes}</p>}
                      {activeSession && (
                        <div className="flex gap-2">
                          {Array.from({ length: exercise.sets }).map((_, si) => (
                            <button key={si} onClick={() => toggleSet(exercise.id, si)} className={`flex-1 py-2 rounded-lg text-xs font-display transition-all ${sets[si] ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-muted-foreground border border-white/5"}`}>
                              {sets[si] ? <CheckCircle2 className="w-4 h-4 mx-auto" /> : `Set ${si + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                      {exercise.restDuration > 0 && <p className="text-muted-foreground text-[10px] mt-2">⏱ Dinlenme: {exercise.restDuration}sn</p>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Antrenman;
