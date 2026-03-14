import { useMemo } from "react";
import { useNutritionCalendar } from "@/hooks/useNutritionCalendar";
import { subDays, startOfDay } from "date-fns";
import type { PlannedFood } from "@/hooks/useDietPlan";

interface Props {
  allFoods: PlannedFood[];
  dietStartDate: string | null;
  dietDurationWeeks: number | null;
  totalTemplateDays: number;
  hasTemplate: boolean;
}

export function useWeeklyAdherence({ allFoods, dietStartDate, dietDurationWeeks, totalTemplateDays, hasTemplate }: Props) {
  const today = new Date();

  const { dayStatsMap, isLoading } = useNutritionCalendar({
    currentMonth: today,
    allFoods,
    dietStartDate,
    dietDurationWeeks,
    totalTemplateDays,
    hasTemplate,
  });

  const result = useMemo(() => {
    const todayStart = startOfDay(today);
    let totalDays = 0;
    let adherentDays = 0;
    const dayResults: { date: string; adherent: boolean | null }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = subDays(todayStart, i);
      const dateStr = d.toISOString().slice(0, 10);
      const stats = dayStatsMap.get(dateStr);

      if (stats && stats.status !== "no-plan") {
        totalDays++;
        const isAdherent = stats.status === "completed";
        if (isAdherent) adherentDays++;
        dayResults.push({ date: dateStr, adherent: isAdherent });
      } else {
        dayResults.push({ date: dateStr, adherent: null });
      }
    }

    const percentage = totalDays > 0 ? Math.round((adherentDays / totalDays) * 100) : 0;

    return { percentage, adherentDays, totalDays, dayResults };
  }, [dayStatsMap]);

  return { ...result, isLoading };
}
