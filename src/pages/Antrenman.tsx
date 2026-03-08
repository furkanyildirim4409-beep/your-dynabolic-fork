import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Calendar, TrendingUp, Clock, Target, History, X, CheckCircle2, Timer, Flame, ChevronDown, ChevronUp, AlertCircle, List, CalendarDays } from "lucide-react";
import WorkoutCard from "@/components/WorkoutCard";
import VisionAIExecution from "@/components/VisionAIExecution";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import ExerciseGoalsSection from "@/components/ExerciseGoalsSection";
import { workoutHistory, assignedWorkouts, WorkoutHistoryEntry } from "@/lib/mockData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Antrenman = () => {
  const [activeWorkout, setActiveWorkout] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistoryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const weeklyStats = [
    { label: "Tamamlanan", value: "5", icon: Target },
    { label: "Toplam Süre", value: "4.2sa", icon: Clock },
    { label: "Yakılan Kalori", value: "2,450", icon: TrendingUp },
  ];

  // Calculate history stats
  const totalBioCoins = workoutHistory.reduce((acc, w) => acc + w.bioCoins, 0);
  const totalWorkouts = workoutHistory.length;

  const handleWorkoutClick = (workout: WorkoutHistoryEntry) => {
    setSelectedWorkout(workout);
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">ANTRENMAN</h1>
            <p className="text-muted-foreground text-sm">Vision AI Eğitim Merkezi</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as 'list' | 'calendar')}
              className="glass-card p-1"
            >
              <ToggleGroupItem 
                value="list" 
                aria-label="Liste Görünümü"
                className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary px-2 py-1.5"
              >
                <List className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="calendar" 
                aria-label="Takvim Görünümü"
                className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary px-2 py-1.5"
              >
                <CalendarDays className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(true)}
              className="p-3 glass-card border border-primary/30 hover:bg-primary/10 transition-colors"
            >
              <History className="w-5 h-5 text-primary" />
            </motion.button>
          </div>
        </div>

        {/* Vision AI Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center neon-glow-sm">
              <Dumbbell className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg text-foreground tracking-wide">
                VİZYON AI AKTİF
              </h2>
              <p className="text-muted-foreground text-xs">
                Hareket analizi ve gerçek zamanlı geri bildirim
              </p>
            </div>
            <motion.div
              className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Weekly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm text-foreground tracking-wide">
              BU HAFTA
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {weeklyStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-secondary mx-auto mb-2 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-display text-lg text-foreground">{stat.value}</p>
                <p className="text-muted-foreground text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Exercise Goals Section */}
        <ExerciseGoalsSection />

        {/* Conditional View: List or Calendar */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Assigned Workouts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg text-foreground tracking-wide">
                    ATANAN ANTRENMANLAR
                  </h2>
                  <span className="text-xs text-primary">{assignedWorkouts.length} Görev</span>
                </div>
                
                <div className="space-y-4">
                  {assignedWorkouts.map((workout, index) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <WorkoutCard
                        title={workout.title}
                        day={workout.day}
                        exercises={workout.exercises}
                        duration={workout.duration}
                        intensity={workout.intensity}
                        coachNote={workout.coachNote}
                        onStart={() => setActiveWorkout(workout.title)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <WorkoutCalendar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vision AI Execution Overlay */}
      <AnimatePresence>
        {activeWorkout && (
          <VisionAIExecution
            workoutTitle={activeWorkout}
            onClose={() => setActiveWorkout(null)}
          />
        )}
      </AnimatePresence>

      {/* Workout History Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="safe-area-inset p-4 h-full overflow-y-auto">
              {/* History Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-2xl text-foreground">GEÇMİŞ</h1>
                  <p className="text-muted-foreground text-sm">Antrenman Kayıtların</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowHistory(false)}
                  className="p-2 glass-card"
                >
                  <X className="w-5 h-5 text-foreground" />
                </motion.button>
              </div>

              {/* History Stats Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 mb-6"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-primary/20 mx-auto mb-2 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-display text-lg text-foreground">{totalWorkouts}</p>
                    <p className="text-muted-foreground text-[10px]">Antrenman</p>
                  </div>
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-stat-strain/20 mx-auto mb-2 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-stat-strain" />
                    </div>
                    <p className="font-display text-lg text-foreground">{totalBioCoins}</p>
                    <p className="text-muted-foreground text-[10px]">Bio-Coin</p>
                  </div>
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-stat-recovery/20 mx-auto mb-2 flex items-center justify-center">
                      <Timer className="w-5 h-5 text-stat-recovery" />
                    </div>
                    <p className="font-display text-lg text-foreground">5.2sa</p>
                    <p className="text-muted-foreground text-[10px]">Toplam</p>
                  </div>
                </div>
              </motion.div>

              {/* History List */}
              <div className="space-y-3 pb-8">
                {workoutHistory.map((workout, index) => (
                  <motion.button
                    key={workout.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleWorkoutClick(workout)}
                    className="w-full glass-card p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                  >
                    {/* Date */}
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="font-display text-lg text-foreground leading-tight">
                        {workout.dateShort.split(" ")[0]}
                      </p>
                      <p className="text-muted-foreground text-[10px] uppercase">
                        {workout.dateShort.split(" ")[1]}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-white/10" />

                    {/* Workout Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-foreground font-medium text-sm truncate">{workout.name}</p>
                        <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] rounded-full font-medium flex-shrink-0">
                          TAMAMLANDI
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {workout.duration}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {workout.exercises} hareket
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-foreground font-display text-sm">{workout.tonnage}</p>
                      <div className="flex items-center gap-1 justify-end text-primary text-[10px]">
                        <Flame className="w-3 h-3" />
                        <span>+{workout.bioCoins}</span>
                      </div>
                    </div>

                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Detail Modal */}
      <AnimatePresence>
        {selectedWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedWorkout(null)}
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
                  setSelectedWorkout(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-background rounded-t-3xl max-h-[85vh] overflow-hidden touch-none"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg text-foreground">ANTRENMAN ÖZETİ</h2>
                  <p className="text-muted-foreground text-xs">{selectedWorkout.date} • {selectedWorkout.duration}</p>
                </div>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Row */}
              <div className="p-4 border-b border-white/10 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="font-display text-xl text-primary">{selectedWorkout.tonnage}</p>
                  <p className="text-muted-foreground text-[10px]">TONAJ</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-foreground">{selectedWorkout.exercises}</p>
                  <p className="text-muted-foreground text-[10px]">HAREKET</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-primary">+{selectedWorkout.bioCoins}</p>
                  <p className="text-muted-foreground text-[10px]">BIO-COIN</p>
                </div>
              </div>

              {/* Exercise List (Accordion) */}
              <div className="p-4 overflow-y-auto max-h-[50vh]">
                <h3 className="font-display text-sm text-muted-foreground mb-3 tracking-wider">HAREKETLER</h3>
                
                <Accordion type="single" collapsible className="space-y-2">
                  {selectedWorkout.details.map((exercise, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`exercise-${index}`}
                      className="glass-card border-white/10 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-foreground text-sm font-medium">{exercise.exerciseName}</p>
                            <p className="text-muted-foreground text-[10px]">{exercise.sets.length} set</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3">
                        <div className="space-y-1 mt-1">
                          {exercise.sets.map((set, setIndex) => (
                            <div 
                              key={setIndex}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                set.isFailure ? "bg-destructive/10 border border-destructive/30" : "bg-secondary/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs w-12">Set {setIndex + 1}</span>
                                {set.isFailure && (
                                  <AlertCircle className="w-3 h-3 text-destructive" />
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-foreground text-sm font-medium">
                                  {set.weight > 0 ? `${set.weight}kg` : "Vücut Ağırlığı"}
                                </span>
                                <span className="text-primary text-sm">
                                  x{set.reps}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Close Button */}
              <div className="p-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedWorkout(null)}
                  className="w-full py-3 bg-secondary text-foreground font-display text-sm rounded-xl"
                >
                  KAPAT
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Antrenman;
