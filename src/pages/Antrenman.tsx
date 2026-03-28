import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Calendar, TrendingUp, Clock, Target, History, X, CheckCircle2, Timer, Flame, ChevronDown, ChevronUp, AlertCircle, List, CalendarDays, Moon, Coffee, Trophy, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eachDayOfInterval, startOfWeek, endOfWeek, format as fnsFormat, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import WorkoutCard from "@/components/WorkoutCard";
import VisionAIExecution from "@/components/VisionAIExecution";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import ExerciseGoalsSection from "@/components/ExerciseGoalsSection";
import { useWorkoutHistory, WorkoutHistoryEntry } from "@/hooks/useWorkoutHistory";
import { useExerciseHistory } from "@/hooks/useExerciseHistory";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignedWorkouts, TransformedWorkout } from "@/hooks/useAssignedWorkouts";
import { useWeeklyWorkoutStats } from "@/hooks/useWeeklyWorkoutStats";
import { format } from "date-fns";
// Note: eachDayOfInterval, startOfWeek, endOfWeek, fnsFormat imported at top

const Antrenman = () => {
  const [activeWorkout, setActiveWorkout] = useState<TransformedWorkout | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistoryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const { data: workouts = [], isLoading } = useAssignedWorkouts();
  const { data: workoutHistory = [], isLoading: isHistoryLoading } = useWorkoutHistory();
  const { data: historyData } = useExerciseHistory();
  const globalPRMap = historyData?.prMap;

  // Today's date string for comparison
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Turkish day names for fallback
  const DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const jsDay = new Date().getDay();
  const todayTR = DAYS_TR[jsDay === 0 ? 6 : jsDay - 1];

  // WEEKLY FOCUS: Lock main feed to current physical week
  const currentWeekWorkouts = useMemo(() => {
    if (!workouts || !workouts.length) return [];
    
    const hasScheduledDates = workouts.some(w => w.scheduledDate);
    if (!hasScheduledDates) return workouts; // Legacy DOW-based: show all

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return workouts.filter(w => {
      if (!w.scheduledDate) return true;
      const d = parseISO(w.scheduledDate);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });
  }, [workouts]);

  // Group workouts: by scheduledDate when available, else by dayOfWeek
  // Also inject rest days for days without workouts
  const groupedByDay = useMemo(() => {
    const groupMap = new Map<string, { label: string; isToday: boolean; isRest: boolean; workouts: TransformedWorkout[] }>();

    for (const w of currentWeekWorkouts) {
      let key: string;
      let label: string;
      let isToday = false;

      if (w.scheduledDate) {
        key = w.scheduledDate;
        label = w.day; // already formatted as "d MMMM EEEE"
        isToday = w.scheduledDate === todayStr;
      } else {
        key = `dow-${w.dayOfWeek ?? "Diğer"}`;
        label = w.dayOfWeek ?? "Diğer";
        isToday = (w.dayOfWeek ?? "") === todayTR;
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, { label, isToday, isRest: false, workouts: [] });
      }
      groupMap.get(key)!.workouts.push(w);
    }

    // Add rest days for missing days
    const hasScheduledDates = currentWeekWorkouts.some(w => w.scheduledDate);
    if (currentWeekWorkouts.length > 0) {
      if (hasScheduledDates) {
        // Scheduled date mode: fill missing days within the current week
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const allDaysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

        for (const day of allDaysInWeek) {
          const dateStr = fnsFormat(day, "yyyy-MM-dd");
          if (!groupMap.has(dateStr)) {
            const label = fnsFormat(day, "d MMMM EEEE", { locale: tr });
            const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
            groupMap.set(dateStr, {
              label: capitalizedLabel,
              isToday: dateStr === todayStr,
              isRest: true,
              workouts: [],
            });
          }
        }
      } else {
        // Day of week mode: fill missing day names
        for (const day of DAYS_TR) {
          const key = `dow-${day}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              label: day,
              isToday: day === todayTR,
              isRest: true,
              workouts: [],
            });
          }
        }
      }
    }

    const allGroups = Array.from(groupMap.entries()).map(([key, val]) => ({
      key,
      ...val,
    }));

    // Sort: scheduled dates by date string, day_of_week by DAYS_TR order
    if (hasScheduledDates) {
      allGroups.sort((a, b) => a.key.localeCompare(b.key));
    } else {
      const dayOrder = new Map(DAYS_TR.map((d, i) => [d.toLowerCase(), i]));
      allGroups.sort((a, b) => {
        const orderA = dayOrder.get(a.label.toLowerCase()) ?? 99;
        const orderB = dayOrder.get(b.label.toLowerCase()) ?? 99;
        return orderA - orderB;
      });
    }

    // Move today's group to front
    const todayIdx = allGroups.findIndex((g) => g.isToday);
    if (todayIdx > 0) {
      const [todayGroup] = allGroups.splice(todayIdx, 1);
      allGroups.unshift(todayGroup);
    }

    return allGroups;
  }, [currentWeekWorkouts, todayStr, todayTR]);

  const { data: weeklyStatsData, isLoading: isWeeklyLoading } = useWeeklyWorkoutStats();

  const weeklyStats = [
    { label: "Tamamlanan", value: weeklyStatsData?.completedCount.toString() ?? "0", icon: Target },
    { label: "Toplam Süre", value: weeklyStatsData?.totalDurationHours ?? "0sa", icon: Clock },
    { label: "Yakılan Kalori", value: weeklyStatsData?.totalCalories ?? "0", icon: TrendingUp },
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
            {isWeeklyLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-2" />
                  <Skeleton className="h-5 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))
            ) : (
              weeklyStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-secondary mx-auto mb-2 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-display text-lg text-foreground">{stat.value}</p>
                  <p className="text-muted-foreground text-[10px]">{stat.label}</p>
                </div>
              ))
            )}
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
              {/* Weekly Workout Schedule */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg text-foreground tracking-wide">
                    HAFTALIK PROGRAM
                  </h2>
                  <span className="text-xs text-primary">{currentWeekWorkouts.length} Antrenman</span>
                </div>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Skeleton className="w-12 h-12 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                        <Skeleton className="h-12 w-full rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : currentWeekWorkouts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-8 text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                      <Coffee className="w-10 h-10 text-primary" />
                    </div>
                    {workouts.length > 0 ? (
                      <>
                        <h3 className="font-display text-lg text-foreground mb-2">BU HAFTA BOŞ</h3>
                        <p className="text-muted-foreground text-sm mb-1">
                          Bu hafta için planlanmış antrenmanın bulunmuyor.
                        </p>
                        <p className="text-muted-foreground/60 text-xs">
                          Takvimden diğer haftaları kontrol edebilirsin.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-display text-lg text-foreground mb-2">DİNLENME GÜNÜ</h3>
                        <p className="text-muted-foreground text-sm mb-1">
                          Henüz atanmış antrenman yok.
                        </p>
                        <p className="text-muted-foreground/60 text-xs">
                          Koçun yeni bir program atadığında burada görünecek.
                        </p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-5">
                    {groupedByDay.map(({ key, label, isToday, isRest, workouts: dayWorkouts }, gi) => {
                      const dayHeader = (
                        <div className={`flex items-center gap-2 ${isToday ? "mb-3" : ""} px-1`}>
                          <div className={`w-2 h-2 rounded-full ${isToday ? "bg-primary animate-pulse" : isRest ? "bg-muted-foreground/20" : "bg-muted-foreground/40"}`} />
                          <h3 className={`font-display text-sm tracking-wider ${isToday ? "text-primary" : isRest ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                            {label.toUpperCase()}
                          </h3>
                          {isToday && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                              BUGÜN
                            </span>
                          )}
                          {isRest && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1">
                              <Moon className="w-3 h-3" />
                              DİNLENME
                            </span>
                          )}
                          {!isToday && !isRest && (
                            <>
                              <span className="text-[10px] text-muted-foreground/60 ml-auto mr-1">
                                {dayWorkouts.length} antrenman
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-data-[state=open]:rotate-180" />
                            </>
                          )}
                        </div>
                      );

                      // Rest day card
                      if (isRest) {
                        const restContent = (
                          <div>
                            {dayHeader}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + gi * 0.03 }}
                              className="glass-card p-4 mt-2 border border-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                                  <Moon className="w-5 h-5 text-muted-foreground/60" />
                                </div>
                                <div>
                                  <p className="font-display text-sm text-muted-foreground">Dinlenme Günü</p>
                                  <p className="text-[11px] text-muted-foreground/50">Kaslarını dinlendir, iyileş 💤</p>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );

                        if (isToday) return <div key={key}>{restContent}</div>;

                        return (
                          <Collapsible key={key} className="group">
                            <CollapsibleTrigger className="w-full py-2">
                              {dayHeader}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-4 border border-muted/30"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                                    <Moon className="w-5 h-5 text-muted-foreground/60" />
                                  </div>
                                  <div>
                                    <p className="font-display text-sm text-muted-foreground">Dinlenme Günü</p>
                                    <p className="text-[11px] text-muted-foreground/50">Kaslarını dinlendir, iyileş 💤</p>
                                  </div>
                                </div>
                              </motion.div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }

                      const workoutCards = (
                        <div className="space-y-3">
                          {dayWorkouts.map((workout, index) => (
                            <motion.div
                              key={workout.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + gi * 0.05 + index * 0.05 }}
                            >
                              <WorkoutCard
                                title={workout.title}
                                day={workout.day}
                                exercises={workout.exercises}
                                duration={workout.duration}
                                intensity={workout.intensity}
                                coachNote={workout.coachNote}
                                exerciseDetails={workout.programExercises}
                                completedToday={workout.completedToday}
                                onStart={() => setActiveWorkout(workout)}
                              />
                            </motion.div>
                          ))}
                        </div>
                      );

                      if (isToday) {
                        return (
                          <div key={key}>
                            {dayHeader}
                            {workoutCards}
                          </div>
                        );
                      }

                      return (
                        <Collapsible key={key} className="group">
                          <CollapsibleTrigger className="w-full py-2">
                            {dayHeader}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            {workoutCards}
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
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
            workoutTitle={activeWorkout.title}
            exercises={activeWorkout.programExercises}
            assignmentId={activeWorkout.id}
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
                {workoutHistory.map((workout, index) => {
                  // Volume comparison: find previous session with the same workout_name
                  let volumeBadge: React.ReactNode = null;
                  const prevSameWorkout = workoutHistory
                    .slice(index + 1)
                    .find((w) => w.name === workout.name);

                  if (!prevSameWorkout) {
                    volumeBadge = (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        İlk Kayıt
                      </span>
                    );
                  } else if (prevSameWorkout.tonnageRaw > 0) {
                    const pct = ((workout.tonnageRaw - prevSameWorkout.tonnageRaw) / prevSameWorkout.tonnageRaw) * 100;
                    const rounded = Math.abs(Math.round(pct));
                    if (pct > 0) {
                      volumeBadge = (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                          ↑ +%{rounded} Hacim
                        </span>
                      );
                    } else if (pct < 0) {
                      volumeBadge = (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">
                          ↓ -%{rounded} Hacim
                        </span>
                      );
                    }
                  }

                  return (
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-foreground font-medium text-sm truncate">{workout.name}</p>
                          <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] rounded-full font-medium flex-shrink-0">
                            TAMAMLANDI
                          </span>
                          {volumeBadge}
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
                        <div className="flex items-center gap-2 justify-end">
                          <span className="flex items-center gap-0.5 text-orange-400 text-[10px] font-medium">
                            🔥 {workout.calories} kcal
                          </span>
                          <span className="flex items-center gap-1 text-primary text-[10px]">
                            <Flame className="w-3 h-3" />
                            +{workout.bioCoins}
                          </span>
                        </div>
                      </div>

                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </motion.button>
                  );
                })}
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
              <div className="p-4 border-b border-white/10 grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="font-display text-xl text-primary">{selectedWorkout.tonnage}</p>
                  <p className="text-muted-foreground text-[10px]">TONAJ</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-orange-400">{selectedWorkout.calories}</p>
                  <p className="text-muted-foreground text-[10px]">KALORİ</p>
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
                  {selectedWorkout.details.map((exercise, index) => {
                    // Calculate max weight in this session for the exercise
                    const sessionMaxWeight = Math.max(...exercise.sets.map(s => s.weight || 0), 0);

                    // Find previous occurrence of same exercise in older logs
                    const currentWorkoutIdx = workoutHistory.findIndex(w => w.id === selectedWorkout.id);
                    const olderLogs = currentWorkoutIdx >= 0 ? workoutHistory.slice(currentWorkoutIdx + 1) : workoutHistory.slice(1);
                    let prevMaxWeight = 0;
                    for (const log of olderLogs) {
                      const prevEx = log.details.find(d => d.exerciseName === exercise.exerciseName);
                      if (prevEx) {
                        prevMaxWeight = Math.max(...prevEx.sets.map(s => s.weight || 0), 0);
                        break;
                      }
                    }

                    // Global PR check
                    const globalPR = globalPRMap?.get(exercise.exerciseName);
                    const isGlobalPR = globalPR && sessionMaxWeight > 0 && sessionMaxWeight >= globalPR.maxWeight;
                    const weightDiff = prevMaxWeight > 0 && sessionMaxWeight > prevMaxWeight ? sessionMaxWeight - prevMaxWeight : 0;

                    return (
                    <AccordionItem 
                      key={index} 
                      value={`exercise-${index}`}
                      className="glass-card border-white/10 rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
                        <div className="flex items-center gap-3 text-left flex-1">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-foreground text-sm font-medium">{exercise.exerciseName}</p>
                              {isGlobalPR && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-0.5">
                                  <Trophy className="w-2.5 h-2.5" /> YENİ REKOR
                                </span>
                              )}
                              {!isGlobalPR && weightDiff > 0 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                                  +{weightDiff} kg
                                </span>
                              )}
                            </div>
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
                    );
                  })}
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
