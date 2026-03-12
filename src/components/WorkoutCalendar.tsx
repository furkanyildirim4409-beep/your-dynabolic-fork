import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Timer, Target, CheckCircle2, Moon, Dumbbell } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday, isFuture, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CalendarDayData {
  date: Date;
  status: 'completed' | 'rest' | 'scheduled' | 'none';
  workout?: {
    name: string;
    duration: string;
    exercises: number;
  };
}

const DOW_MAP: Record<string, number> = {
  pazartesi: 1, salı: 2, çarşamba: 3, perşembe: 4,
  cuma: 5, cumartesi: 6, pazar: 0,
};

const WorkoutCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState(0);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Fetch completed workout logs for visible month
  const { data: monthLogs = [] } = useQuery({
    queryKey: ["calendar-logs", user?.id, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, workout_name, logged_at, duration_minutes, exercises_count, completed")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("logged_at", monthStart.toISOString())
        .lte("logged_at", monthEnd.toISOString());
      if (error) return [];
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch assigned workouts (recurring schedule)
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

  // Build a set of active training day-of-week numbers from assignments
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
    // 1. Check completed logs
    const completedLog = monthLogs.find(log => {
      if (!log.logged_at) return false;
      return isSameDay(parseISO(log.logged_at), date);
    });

    if (completedLog) {
      const dur = completedLog.duration_minutes ?? 0;
      return {
        date,
        status: 'completed',
        workout: {
          name: completedLog.workout_name,
          duration: dur >= 60 ? `${Math.floor(dur / 60)}sa ${dur % 60}dk` : `${dur}dk`,
          exercises: completedLog.exercises_count ?? 0,
        },
      };
    }

    // 2. Check scheduled (future/today)
    if (isFuture(date) || isToday(date)) {
      // Check by scheduled_date first
      const byDate = assignments.find(aw => {
        if (!aw.scheduled_date) return false;
        return isSameDay(parseISO(aw.scheduled_date + "T00:00:00"), date);
      });

      // Then by day_of_week
      const byDOW = !byDate
        ? assignments.find(aw => {
            if (!aw.day_of_week) return false;
            const dow = DOW_MAP[aw.day_of_week.toLowerCase()];
            return dow === getDay(date);
          })
        : null;

      const match = byDate || byDOW;
      if (match) {
        const exCount = Array.isArray(match.exercises) ? (match.exercises as any[]).length : 0;
        return {
          date,
          status: 'scheduled',
          workout: {
            name: match.workout_name,
            duration: `~${exCount * 10}dk`,
            exercises: exCount,
          },
        };
      }

      // Rest day: has assignments but this day isn't scheduled
      if (scheduledDOWs.size > 0 && !scheduledDOWs.has(getDay(date))) {
        return { date, status: 'rest' };
      }
    } else {
      // Past day with no completed log — check if it was a scheduled day
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

  const handlePrevMonth = () => {
    setSlideDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setSlideDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

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

            return (
              <Popover key={day.toISOString()}>
                <PopoverTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center gap-1
                      transition-colors relative
                      ${isCurrentDay ? 'bg-primary/20 border border-primary/50' : 'hover:bg-secondary/50'}
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
                </PopoverTrigger>

                {dayData.workout && (
                  <PopoverContent className="w-64 p-0 bg-card border-white/10" side="top" align="center">
                    <div className="p-3 border-b border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dayData.status === 'completed' ? 'bg-primary' : 'border border-primary/50'}`} />
                        <span className="text-xs text-muted-foreground">
                          {format(day, 'd MMMM', { locale: tr })}
                        </span>
                      </div>
                      <h4 className="font-display text-foreground text-sm">{dayData.workout.name}</h4>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-foreground">{dayData.workout.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-foreground">{dayData.workout.exercises} hareket</span>
                      </div>
                    </div>
                    {dayData.status === 'completed' && (
                      <div className="px-3 pb-3">
                        <div className="flex items-center gap-2 text-primary text-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Tamamlandı</span>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                )}

                {dayData.status === 'rest' && (
                  <PopoverContent className="w-48 p-3 bg-card border-white/10" side="top" align="center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Moon className="w-4 h-4" />
                      <span className="text-sm">Dinlenme Günü</span>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10">
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
    </motion.div>
  );
};

export default WorkoutCalendar;
