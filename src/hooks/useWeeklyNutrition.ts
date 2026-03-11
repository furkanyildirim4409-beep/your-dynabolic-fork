import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface DailyNutritionSummary {
  date: string;
  dayLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTH_NAMES = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function useWeeklyNutrition(weekOffset = 0) {
  const { user } = useAuth();
  const [data, setData] = useState<DailyNutritionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const fetchWeek = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // End date: today minus (weekOffset * 7) days
    const endDay = new Date(todayLocal);
    endDay.setDate(endDay.getDate() - weekOffset * 7);

    // Start date: 6 days before endDay
    const startDay = new Date(endDay);
    startDay.setDate(startDay.getDate() - 6);

    const startDate = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate());
    const endDate = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 59, 59, 999);

    // Format date range for display
    setDateRange({
      start: `${startDay.getDate()} ${MONTH_NAMES[startDay.getMonth()]}`,
      end: `${endDay.getDate()} ${MONTH_NAMES[endDay.getMonth()]}`,
    });

    const { data: rows, error } = await supabase
      .from("consumed_foods")
      .select("calories, protein, carbs, fat, logged_at")
      .eq("athlete_id", user.id)
      .gte("logged_at", startDate.toISOString())
      .lte("logged_at", endDate.toISOString());

    if (error) {
      console.error("Weekly nutrition fetch error:", error);
      setIsLoading(false);
      return;
    }

    // Build 7-day buckets
    const buckets: Record<string, DailyNutritionSummary> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      buckets[key] = {
        date: key,
        dayLabel: DAY_LABELS[d.getDay()],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    (rows || []).forEach((r) => {
      if (!r.logged_at) return;
      const local = new Date(r.logged_at);
      const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
      if (buckets[key]) {
        buckets[key].calories += r.calories || 0;
        buckets[key].protein += Number(r.protein) || 0;
        buckets[key].carbs += Number(r.carbs) || 0;
        buckets[key].fat += Number(r.fat) || 0;
      }
    });

    setData(Object.values(buckets));
    setIsLoading(false);
  }, [user, weekOffset]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  return { data, isLoading, dateRange, refetch: fetchWeek };
}
