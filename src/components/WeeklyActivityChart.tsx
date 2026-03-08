import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Dumbbell, Clock, Flame, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface DayActivity {
  day: string;
  fullDay: string;
  completed: boolean;
  workoutType?: string;
  duration?: string;
  calories?: string;
  exercises?: { name: string; sets: number; reps: string }[];
}

const weekData: DayActivity[] = [
  { 
    day: "Pzt", 
    fullDay: "Pazartesi",
    completed: true, 
    workoutType: "Üst Vücut",
    duration: "52 dk",
    calories: "380 kcal",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8-10" },
      { name: "Shoulder Press", sets: 3, reps: "10-12" },
      { name: "Tricep Pushdown", sets: 3, reps: "12-15" },
    ]
  },
  { 
    day: "Sal", 
    fullDay: "Salı",
    completed: true, 
    workoutType: "Bacak",
    duration: "48 dk",
    calories: "420 kcal",
    exercises: [
      { name: "Squat", sets: 4, reps: "6-8" },
      { name: "Leg Press", sets: 3, reps: "10-12" },
      { name: "Leg Curl", sets: 3, reps: "12-15" },
    ]
  },
  { 
    day: "Çar", 
    fullDay: "Çarşamba",
    completed: true,
    workoutType: "Kardiyo",
    duration: "35 dk",
    calories: "290 kcal",
    exercises: [
      { name: "Treadmill HIIT", sets: 1, reps: "20 dk" },
      { name: "Rowing", sets: 1, reps: "15 dk" },
    ]
  },
  { 
    day: "Per", 
    fullDay: "Perşembe",
    completed: true, 
    workoutType: "Push",
    duration: "55 dk",
    calories: "365 kcal",
    exercises: [
      { name: "Incline DB Press", sets: 4, reps: "8-10" },
      { name: "Cable Fly", sets: 3, reps: "12-15" },
      { name: "Lateral Raise", sets: 4, reps: "12-15" },
    ]
  },
  { 
    day: "Cum", 
    fullDay: "Cuma",
    completed: true, 
    workoutType: "Pull",
    duration: "50 dk",
    calories: "340 kcal",
    exercises: [
      { name: "Pull-ups", sets: 4, reps: "8-10" },
      { name: "Barbell Row", sets: 4, reps: "8-10" },
      { name: "Face Pull", sets: 3, reps: "15-20" },
    ]
  },
  { 
    day: "Cmt", 
    fullDay: "Cumartesi",
    completed: true, 
    workoutType: "Bacak",
    duration: "58 dk",
    calories: "450 kcal",
    exercises: [
      { name: "Deadlift", sets: 4, reps: "5-6" },
      { name: "Bulgarian Split", sets: 3, reps: "10-12" },
      { name: "Calf Raise", sets: 4, reps: "15-20" },
    ]
  },
  { 
    day: "Paz", 
    fullDay: "Pazar",
    completed: true,
    workoutType: "Active Recovery",
    duration: "30 dk",
    calories: "150 kcal",
    exercises: [
      { name: "Yoga Flow", sets: 1, reps: "20 dk" },
      { name: "Foam Rolling", sets: 1, reps: "10 dk" },
    ]
  },
];

const WeeklyActivityChart = () => {
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  
  const completedCount = weekData.filter(d => d.completed).length;
  const allCompleted = completedCount === 7;
  const todayIndex = 6;

  // Trigger confetti when all 7 days are completed
  useEffect(() => {
    if (allCompleted && !hasShownConfetti) {
      const timer = setTimeout(() => {
        // Fire confetti from both sides
        const defaults = {
          spread: 60,
          ticks: 100,
          gravity: 0.8,
          decay: 0.94,
          startVelocity: 30,
          colors: ['#CCFF00', '#00FF88', '#FFD700', '#FF6B6B', '#4ECDC4']
        };

        confetti({
          ...defaults,
          particleCount: 40,
          origin: { x: 0.2, y: 0.6 }
        });
        
        confetti({
          ...defaults,
          particleCount: 40,
          origin: { x: 0.8, y: 0.6 }
        });

        // Center burst
        setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 60,
            spread: 100,
            origin: { x: 0.5, y: 0.5 }
          });
        }, 150);

        setHasShownConfetti(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [allCompleted, hasShownConfetti]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <h3 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              Haftalık Aktivite
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {allCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-primary"
              >
                <Trophy className="w-3.5 h-3.5" />
              </motion.div>
            )}
            <span className={`text-xs font-medium ${allCompleted ? "text-primary" : "text-muted-foreground"}`}>
              {completedCount}/7 gün
            </span>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((day, index) => (
            <motion.button
              key={day.day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => day.completed && setSelectedDay(day)}
              disabled={!day.completed}
              className="flex flex-col items-center gap-2 disabled:cursor-default"
            >
              {/* Day Label */}
              <span className={`text-[10px] uppercase tracking-wider ${
                index === todayIndex ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                {day.day}
              </span>

              {/* Status Circle */}
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center transition-all
                ${day.completed 
                  ? "bg-primary/20 border border-primary/40 hover:bg-primary/30 hover:border-primary/60" 
                  : index === todayIndex
                    ? "bg-white/[0.05] border border-white/10 border-dashed"
                    : "bg-white/[0.02] border border-white/[0.05]"
                }
              `}>
                {day.completed ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : index === todayIndex ? (
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                ) : (
                  <X className="w-3 h-3 text-muted-foreground/30" />
                )}
              </div>

              {/* Workout Type (if completed) */}
              {day.workoutType && (
                <span className="text-[8px] text-muted-foreground text-center leading-tight truncate w-full">
                  {day.workoutType}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Streak indicator */}
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-center gap-2">
          <span className="text-muted-foreground text-xs">🔥</span>
          <span className="text-foreground text-xs font-medium">14 günlük seri</span>
          {allCompleted && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-primary text-xs font-medium ml-2"
            >
              • Mükemmel Hafta! 🎉
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedDay(null)}
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
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setSelectedDay(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[430px] bg-background border-t border-white/10 rounded-t-3xl overflow-hidden touch-none"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">{selectedDay.fullDay}</h2>
                  <p className="text-primary text-sm font-medium">{selectedDay.workoutType}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="px-5 py-4 border-y border-white/[0.05] grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground text-sm font-medium">{selectedDay.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-foreground text-sm font-medium">{selectedDay.calories}</span>
                </div>
              </div>

              {/* Exercises List */}
              <div className="px-5 py-4">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3">Egzersizler</p>
                <div className="space-y-2">
                  {selectedDay.exercises?.map((exercise, idx) => (
                    <motion.div
                      key={exercise.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-lg p-3"
                    >
                      <span className="text-foreground text-sm">{exercise.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Completion Badge */}
              <div className="px-5 pb-8">
                <div className="flex items-center justify-center gap-2 py-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-primary text-sm font-medium">Tamamlandı</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WeeklyActivityChart;