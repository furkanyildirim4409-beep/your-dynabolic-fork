import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Timer, Target, CheckCircle2, Moon, Dumbbell, Flame, TrendingUp, X, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday, isFuture, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CalendarDayData {
  date: Date;
  status: 'completed' | 'rest' | 'scheduled' | 'none';
  workout?: {
    name: string;
    duration: string;
    exercises: number;
    tonnage?: number;
    details?: { exerciseName: string; sets: { weight: number; reps: number; isFailure?: boolean }[] }[];
    bioCoins?: number;
    durationMinutes?: number;
  };
  scheduledExercises?: { name: string; sets: number; reps: string; rir?: number }[];
}

const DOW_MAP: Record<string, number> = {
  pazartesi: 1, salı: 2, çarşamba: 3, perşembe: 4,
  cuma: 5, cumartesi: 6, pazar: 0,
};

const WorkoutCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState(0);
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Fetch completed workout logs with details
  const { data: monthLogs = [] } = useQuery({
    queryKey: ["calendar-logs", user?.id, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, workout_name, logged_at, duration_minutes, exercises_count, completed, tonnage, details, bio_coins_earned")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("logged_at", monthStart.toISOString())
        .lte("logged_at", monthEnd.toISOString());
      if (error) return [];
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch assigned workouts
  const { data: assignments = [] } = useQuery({
    queryKey: ["calendar-assignments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("id, workout_name, day_of_week, scheduled_date, exercises")
        .eq("athlete_id", user.id);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const scheduledDOWs = useMemo(() => {
    const set = new Set<number>();
    for (const aw of assignments) {
      if (aw.day_of_week) {
        const dow = DOW_MAP[aw.day_of_week.toLowerCase()];
        if (dow !== undefined) set.add(dow);
      }
    }
    return set;
  }, [assignments]);

  const getDayData = (date: Date): CalendarDayData => {
    const completedLog = monthLogs.find(log => {
      if (!log.logged_at) return false;
      return isSameDay(parseISO(log.logged_at), date);
    });

    if (completedLog) {
      const dur = completedLog.duration_minutes ?? 0;
      let details: CalendarDayData["workout"]!["details"] = [];
      if (completedLog.details && Array.isArray(completedLog.details)) {
        details = (completedLog.details as any[]).map(d => ({
          exerciseName: d.exerciseName ?? d.exercise_name ?? "Bilinmeyen",
          sets: Array.isArray(d.sets) ? d.sets.map((s: any) => ({
            weight: s.weight ?? 0, reps: s.reps ?? 0, isFailure: s.isFailure ?? false,
          })) : [],
        }));
      }
      return {
        date,
        status: 'completed',
        workout: {
          name: completedLog.workout_name,
          duration: dur >= 60 ? `${Math.floor(dur / 60)}sa ${dur % 60}dk` : `${dur}dk`,
          exercises: completedLog.exercises_count ?? details.length,
          tonnage: completedLog.tonnage ?? 0,
          details,
          bioCoins: completedLog.bio_coins_earned ?? 0,
          durationMinutes: dur,
        },
      };
    }

    if (isFuture(date) || isToday(date)) {
      const byDate = assignments.find(aw => {
        if (!aw.scheduled_date) return false;
        return isSameDay(parseISO(aw.scheduled_date + "T00:00:00"), date);
      });
      const byDOW = !byDate
        ? assignments.find(aw => {
            if (!aw.day_of_week) return false;
            return DOW_MAP[aw.day_of_week.toLowerCase()] === getDay(date);
          })
        : null;
      const match = byDate || byDOW;
      if (match) {
        const exArr = Array.isArray(match.exercises) ? (match.exercises as any[]) : [];
        return {
          date,
          status: 'scheduled',
          workout: {
            name: match.workout_name,
            duration: `~${exArr.length * 10}dk`,
            exercises: exArr.length,
          },
          scheduledExercises: exArr.map(e => ({
            name: e.name ?? "Bilinmeyen",
            sets: e.sets ?? 3,
            reps: e.reps ?? "10",
            rir: e.rir,
          })),
        };
      }
      if (scheduledDOWs.size > 0 && !scheduledDOWs.has(getDay(date))) {
        return { date, status: 'rest' };
      }
    } else {
      const wasDOW = assignments.some(aw => {
        if (!aw.day_of_week) return false;
        return DOW_MAP[aw.day_of_week.toLowerCase()] === getDay(date);
      });
      const wasByDate = assignments.some(aw => {
        if (!aw.scheduled_date) return false;
        return isSameDay(parseISO(aw.scheduled_date + "T00:00:00"), date);
      });
      if (scheduledDOWs.size > 0 && !wasDOW && !wasByDate) {
        return { date, status: 'rest' };
      }
    }
    return { date, status: 'none' };
  };

  const handlePrevMonth = () => { setSlideDirection(-1); setCurrentMonth(subMonths(currentMonth, 1)); };
  const handleNextMonth = () => { setSlideDirection(1); setCurrentMonth(addMonths(currentMonth, 1)); };

  const renderDayIndicator = (dayData: CalendarDayData) => {
    switch (dayData.status) {
      case 'completed':
        return <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-primary" />;
      case 'rest':
        return <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />;
      case 'scheduled':
        return <div className="w-2 h-2 rounded-full border border-primary/50" />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePrevMonth} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <AnimatePresence mode="wait">
          <motion.h2
            key={currentMonth.toISOString()}
            initial={{ opacity: 0, x: slideDirection * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection * -20 }}
            transition={{ duration: 0.2 }}
            className="font-display text-lg text-foreground tracking-wider uppercase"
          >
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </motion.h2>
        </AnimatePresence>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleNextMonth} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </motion.button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-muted-foreground text-[10px] font-medium py-2">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth.toISOString()}
          initial={{ opacity: 0, x: slideDirection * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDirection * -50 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="grid grid-cols-7 gap-1"
        >
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {daysInMonth.map((day) => {
            const dayData = getDayData(day);
            const isCurrentDay = isToday(day);
            const hasContent = dayData.status !== 'none';

            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => hasContent && setSelectedDay(dayData)}
                className={`
                  aspect-square rounded-lg flex flex-col items-center justify-center gap-1
                  transition-colors relative
                  ${isCurrentDay ? 'bg-primary/20 border border-primary/50' : hasContent ? 'hover:bg-secondary/50 cursor-pointer' : ''}
                  ${dayData.status === 'completed' ? 'bg-primary/10' : ''}
                `}
              >
                {isCurrentDay && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border border-primary/50"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <span className={`text-sm ${isCurrentDay ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
                {renderDayIndicator(dayData)}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Tamamlandı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-primary/50" />
          <span className="text-[10px] text-muted-foreground">Planlandı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <span className="text-[10px] text-muted-foreground">Dinlenme</span>
        </div>
      </div>

      {/* Day Detail Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-md bg-card border-border/50 p-0 gap-0 overflow-hidden">
          {selectedDay && <DayDetailContent day={selectedDay} onClose={() => setSelectedDay(null)} />}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const DayDetailContent = ({ day, onClose }: { day: CalendarDayData; onClose: () => void }) => {
  const statusConfig = {
    completed: { label: "Tamamlandı", color: "text-primary", bg: "bg-primary/10", icon: CheckCircle2 },
    scheduled: { label: "Planlandı", color: "text-blue-400", bg: "bg-blue-500/10", icon: Calendar },
    rest: { label: "Dinlenme Günü", color: "text-muted-foreground", bg: "bg-muted/50", icon: Moon },
    none: { label: "", color: "", bg: "", icon: Dumbbell },
  };
  const cfg = statusConfig[day.status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className={`p-5 ${cfg.bg} border-b border-border/30`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(day.date, "d MMMM yyyy, EEEE", { locale: tr })}
          </span>
        </div>
        {day.workout && (
          <h3 className="font-display text-lg text-foreground">{day.workout.name}</h3>
        )}
        {day.status === 'rest' && (
          <h3 className="font-display text-lg text-foreground">Dinlenme Günü</h3>
        )}
      </div>

      {/* Completed workout details */}
      {day.status === 'completed' && day.workout && (
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <Timer className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground">{day.workout.duration}</span>
              <p className="text-[10px] text-muted-foreground">Süre</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <Target className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground">{day.workout.exercises}</span>
              <p className="text-[10px] text-muted-foreground">Hareket</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground">
                {(day.workout.tonnage ?? 0) >= 1000
                  ? `${((day.workout.tonnage ?? 0) / 1000).toFixed(1)}t`
                  : `${day.workout.tonnage ?? 0}kg`}
              </span>
              <p className="text-[10px] text-muted-foreground">Tonaj</p>
            </div>
          </div>

          {/* BioCoin */}
          {(day.workout.bioCoins ?? 0) > 0 && (
            <div className="flex items-center gap-2 bg-accent/20 rounded-lg px-3 py-2">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-xs text-foreground font-medium">+{day.workout.bioCoins} BioCoin kazanıldı</span>
            </div>
          )}

          {/* Exercise breakdown */}
          {day.workout.details && day.workout.details.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Egzersiz Detayları</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {day.workout.details.map((ex, i) => {
                  const totalVol = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
                  const maxW = Math.max(...ex.sets.map(s => s.weight), 0);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-secondary/30 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{ex.exerciseName}</span>
                        <span className="text-[10px] text-muted-foreground">{ex.sets.length} set · max {maxW}kg</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ex.sets.map((set, si) => (
                          <span
                            key={si}
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              set.isFailure
                                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {set.weight}kg × {set.reps}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scheduled workout details */}
      {day.status === 'scheduled' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <Target className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground">{day.workout?.exercises ?? 0}</span>
              <p className="text-[10px] text-muted-foreground">Hareket</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <Timer className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <span className="text-sm font-bold text-foreground">{day.workout?.duration}</span>
              <p className="text-[10px] text-muted-foreground">Tahmini Süre</p>
            </div>
          </div>

          {day.scheduledExercises && day.scheduledExercises.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Planlanan Egzersizler</h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {day.scheduledExercises.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2.5"
                  >
                    <span className="text-sm text-foreground">{ex.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {ex.sets} × {ex.reps}{ex.rir !== undefined ? ` · RIR ${ex.rir}` : ''}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rest day */}
      {day.status === 'rest' && (
        <div className="p-8 text-center">
          <Moon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Bugün dinlenme günü.<br />Kasların toparlanıyor 💪</p>
        </div>
      )}
    </motion.div>
  );
};

export default WorkoutCalendar;
