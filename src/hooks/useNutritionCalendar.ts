import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Module-level cache — survives Dialog unmounts
const globalLogsCache = new Map<string, Map<string, { meal_name: string; total_calories: number; total_protein: number; total_carbs: number; total_fat: number }[]>>();
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  parseISO,
  differenceInDays,
  format,
  addDays,
  eachDayOfInterval,
} from "date-fns";
import type { PlannedFood } from "@/hooks/useDietPlan";

export type DayStatus = "completed" | "under" | "over" | "empty" | "no-plan" | "scheduled";

export interface DayNutritionStats {
  date: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  delta: number;
  status: DayStatus;
  plannedFoods: PlannedFood[];
  logs: { meal_name: string; total_calories: number; total_protein: number; total_carbs: number; total_fat: number }[];
}

interface UseNutritionCalendarProps {
  currentMonth: Date;
  allFoods: PlannedFood[];
  dietStartDate: string | null;
  dietDurationWeeks: number | null;
  totalTemplateDays: number;
  hasTemplate: boolean;
}

export function useNutritionCalendar({
  currentMonth,
  allFoods,
  dietStartDate,
  dietDurationWeeks,
  totalTemplateDays,
  hasTemplate,
}: UseNutritionCalendarProps) {
  const { user } = useAuth();
  const [logsMap, setLogsMap] = useState<
    Map<string, { meal_name: string; total_calories: number; total_protein: number; total_carbs: number; total_fat: number }[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("logged_at, meal_name, total_calories, total_protein, total_carbs, total_fat")
        .eq("user_id", user.id)
        .gte("logged_at", format(monthStart, "yyyy-MM-dd"))
        .lt("logged_at", format(addDays(monthEnd, 1), "yyyy-MM-dd"))
        .order("logged_at", { ascending: true });

      if (error) {
        console.error("Nutrition calendar fetch error:", error.message);
        setIsLoading(false);
        return;
      }

      const map = new Map<string, { meal_name: string; total_calories: number; total_protein: number; total_carbs: number; total_fat: number }[]>();
      (data || []).forEach((row) => {
        const dateKey = (row.logged_at || "").slice(0, 10);
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push({
          meal_name: row.meal_name,
          total_calories: Number(row.total_calories) || 0,
          total_protein: Number(row.total_protein) || 0,
          total_carbs: Number(row.total_carbs) || 0,
          total_fat: Number(row.total_fat) || 0,
        });
      });

      setLogsMap(map);
      setIsLoading(false);
    };

    fetchLogs();
  }, [user, currentMonth]);

  // Precompute target macros per day_number
  const targetsByDayNumber = useMemo(() => {
    const map = new Map<number, { calories: number; protein: number; carbs: number; fat: number }>();
    allFoods.forEach((f) => {
      const dn = f.day_number || 1;
      const existing = map.get(dn) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      map.set(dn, {
        calories: existing.calories + f.calories,
        protein: existing.protein + f.protein,
        carbs: existing.carbs + f.carbs,
        fat: existing.fat + f.fat,
      });
    });
    return map;
  }, [allFoods]);

  // Precompute planned foods grouped by day_number
  const foodsByDayNumber = useMemo(() => {
    const map = new Map<number, PlannedFood[]>();
    allFoods.forEach((f) => {
      const dn = f.day_number || 1;
      if (!map.has(dn)) map.set(dn, []);
      map.get(dn)!.push(f);
    });
    return map;
  }, [allFoods]);

  const dayStatsMap = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const today = startOfDay(new Date());

    const startDate = dietStartDate ? startOfDay(parseISO(dietStartDate)) : null;
    const durationDays = (dietDurationWeeks || 4) * 7;

    const result = new Map<string, DayNutritionStats>();

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayStart = startOfDay(day);
      const isFuture = dayStart > today;

      const dayLogs = logsMap.get(dateStr) || [];
      const consumedCalories = dayLogs.reduce((s, l) => s + l.total_calories, 0);
      const consumedProtein = dayLogs.reduce((s, l) => s + l.total_protein, 0);
      const consumedCarbs = dayLogs.reduce((s, l) => s + l.total_carbs, 0);
      const consumedFat = dayLogs.reduce((s, l) => s + l.total_fat, 0);

      let targetCalories = 0;
      let targetProtein = 0;
      let targetCarbs = 0;
      let targetFat = 0;
      let status: DayStatus = "no-plan";
      let plannedFoods: PlannedFood[] = [];

      if (hasTemplate && startDate) {
        const elapsed = differenceInDays(dayStart, startDate);
        const isWithinProgram = elapsed >= 0 && elapsed < durationDays;

        if (isWithinProgram) {
          const historicalDayNumber = (elapsed % totalTemplateDays) + 1;
          const targets = targetsByDayNumber.get(historicalDayNumber);
          targetCalories = targets?.calories || 0;
          targetProtein = targets?.protein || 0;
          targetCarbs = targets?.carbs || 0;
          targetFat = targets?.fat || 0;
          plannedFoods = foodsByDayNumber.get(historicalDayNumber) || [];

          if (isFuture) {
            status = "scheduled";
          } else {
            if (consumedCalories === 0 && dayLogs.length === 0) {
              status = "empty";
            } else {
              const delta = consumedCalories - targetCalories;
              if (delta < -150) status = "under";
              else if (delta > 150) status = "over";
              else status = "completed";
            }
          }
        } else {
          if (isFuture) {
            status = "no-plan";
          } else {
            status = consumedCalories > 0 ? "completed" : "empty";
          }
        }
      } else {
        if (isFuture) {
          // No template, future — skip creating stats
          return;
        }
        status = consumedCalories > 0 ? "completed" : "empty";
      }

      const delta = consumedCalories - targetCalories;

      result.set(dateStr, {
        date: dateStr,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        consumedCalories,
        consumedProtein,
        consumedCarbs,
        consumedFat,
        delta,
        status,
        plannedFoods,
        logs: dayLogs,
      });
    });

    return result;
  }, [currentMonth, logsMap, allFoods, dietStartDate, dietDurationWeeks, totalTemplateDays, hasTemplate, targetsByDayNumber, foodsByDayNumber]);

  return { dayStatsMap, isLoading };
}
