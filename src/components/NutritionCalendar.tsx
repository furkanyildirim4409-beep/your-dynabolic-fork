import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, addMonths, subMonths, startOfDay, getDay, getDaysInMonth, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNutritionCalendar, type DayNutritionStats, type DayStatus } from "@/hooks/useNutritionCalendar";
import NutritionDayDetailModal from "@/components/NutritionDayDetailModal";
import type { PlannedFood } from "@/hooks/useDietPlan";

interface Props {
  allFoods: PlannedFood[];
  dietStartDate: string | null;
  dietDurationWeeks: number | null;
  totalTemplateDays: number;
  hasTemplate: boolean;
}

const STATUS_COLORS: Record<DayStatus, string> = {
  completed: "bg-emerald-500",
  under: "bg-destructive",
  over: "bg-orange-500",
  empty: "bg-muted-foreground/30",
  "no-plan": "bg-muted-foreground/20",
  scheduled: "bg-blue-400",
};

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function NutritionCalendar({ allFoods, dietStartDate, dietDurationWeeks, totalTemplateDays, hasTemplate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStats, setSelectedStats] = useState<DayNutritionStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { dayStatsMap, isLoading } = useNutritionCalendar({
    currentMonth,
    allFoods,
    dietStartDate,
    dietDurationWeeks,
    totalTemplateDays,
    hasTemplate,
  });

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = (getDay(monthStart) + 6) % 7;

  const handleDayClick = (dateStr: string) => {
    const stats = dayStatsMap.get(dateStr);
    if (stats) {
      setSelectedStats(stats);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          {format(currentMonth, "MMMM yyyy", { locale: tr })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = addDays(monthStart, i);
          const dateStr = format(day, "yyyy-MM-dd");
          const isToday = startOfDay(day).getTime() === today.getTime();
          const isFutureDay = startOfDay(day) > today;
          const stats = dayStatsMap.get(dateStr);

          return (
            <button
              key={dateStr}
              disabled={!stats}
              onClick={() => handleDayClick(dateStr)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs transition-all relative",
                isToday && "ring-1 ring-primary",
                !stats
                  ? "text-muted-foreground/30 cursor-default"
                  : isFutureDay
                    ? "text-muted-foreground/60 hover:bg-secondary/50 cursor-pointer"
                    : "text-foreground hover:bg-secondary/50 cursor-pointer"
              )}
            >
              <span className={cn("font-medium", isToday && "text-primary font-bold")}>{i + 1}</span>
              {stats && (
                <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[stats.status])} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
        {[
          { status: "completed" as DayStatus, label: "Hedefte" },
          { status: "under" as DayStatus, label: "Eksik" },
          { status: "over" as DayStatus, label: "Fazla" },
          { status: "scheduled" as DayStatus, label: "Planlandı" },
          { status: "empty" as DayStatus, label: "Boş" },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[status])} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <NutritionDayDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        stats={selectedStats}
      />
    </div>
  );
}
