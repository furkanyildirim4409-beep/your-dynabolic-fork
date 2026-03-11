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

export function useWeeklyNutrition() {
  const { user } = useAuth();
  const [data, setData] = useState<DailyNutritionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWeek = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    // Start from 6 days ago at local midnight
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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

    // Build 7-day buckets using local dates
    const buckets: Record<string, DailyNutritionSummary> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
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

    // Aggregate rows into local-date buckets
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
  }, [user]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  return { data, isLoading, refetch: fetchWeek };
}
