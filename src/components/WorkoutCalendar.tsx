import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Dumbbell, Timer, Target, X, CheckCircle2, Moon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday, isFuture, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useAssignedWorkouts } from "@/hooks/useAssignedWorkouts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CalendarDayData {
  date: Date;
  status: 'completed' | 'rest' | 'scheduled' | 'none';
  workout?: {
    name: string;
    duration: string;
    focus: string;
    exercises: number;
  };
}

// Parse workout history dates
const parseWorkoutDate = (dateStr: string): Date => {
  // Format: "27 Ocak 2026"
  const months: Record<string, number> = {
    'Ocak': 0, 'Şubat': 1, 'Mart': 2, 'Nisan': 3, 'Mayıs': 4, 'Haziran': 5,
    'Temmuz': 6, 'Ağustos': 7, 'Eylül': 8, 'Ekim': 9, 'Kasım': 10, 'Aralık': 11
  };
  const parts = dateStr.split(' ');
  const day = parseInt(parts[0]);
  const month = months[parts[1]] || 0;
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
};

const WorkoutCalendar = () => {
  const { data: workoutHistory = [] } = useWorkoutHistory();
  const { data: assignedWorkouts = [] } = useAssignedWorkouts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState(0);
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);

  // Get days in month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate starting offset (Monday = 0)
  const startDayOfWeek = getDay(monthStart);
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Determine day status
  const getDayData = (date: Date): CalendarDayData => {
    // Check workout history for completed workouts
    const completedWorkout = workoutHistory.find(w => {
      const workoutDate = parseWorkoutDate(w.date);
      return isSameDay(workoutDate, date) && w.completed;
    });

    if (completedWorkout) {
      return {
        date,
        status: 'completed',
        workout: {
          name: completedWorkout.name,
          duration: completedWorkout.duration,
          focus: completedWorkout.name.split(' & ')[0],
          exercises: completedWorkout.exercises
        }
      };
    }

    // Check assigned workouts for scheduled
    if (isFuture(date) || isToday(date)) {
      const dayOfWeek = format(date, 'EEEE', { locale: tr });
      const scheduledWorkout = assignedWorkouts.find(w => 
        w.day.toLowerCase().startsWith(dayOfWeek.toLowerCase())
      );

      if (scheduledWorkout) {
        return {
          date,
          status: 'scheduled',
          workout: {
            name: scheduledWorkout.title,
            duration: scheduledWorkout.duration,
            focus: scheduledWorkout.title,
            exercises: scheduledWorkout.exercises
          }
        };
      }

      // Check for rest days (weekends in this example)
      const dayIndex = getDay(date);
      if (dayIndex === 0 || dayIndex === 6) {
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
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        );
      case 'rest':
        return (
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
        );
      case 'scheduled':
        return (
          <div className="w-2 h-2 rounded-full border border-primary/50" />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrevMonth}
          className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
        >
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
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNextMonth}
          className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </motion.button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-muted-foreground text-[10px] font-medium py-2">
            {day}
          </div>
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
          {/* Empty cells for offset */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Day cells */}
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
                    {/* Today pulse indicator */}
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
                  <PopoverContent 
                    className="w-64 p-0 bg-card border-white/10" 
                    side="top"
                    align="center"
                  >
                    <div className="p-3 border-b border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${
                          dayData.status === 'completed' ? 'bg-primary' : 'border border-primary/50'
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {format(day, 'd MMMM', { locale: tr })}
                        </span>
                      </div>
                      <h4 className="font-display text-foreground text-sm">
                        {dayData.workout.name}
                      </h4>
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
                  <PopoverContent 
                    className="w-48 p-3 bg-card border-white/10" 
                    side="top"
                    align="center"
                  >
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