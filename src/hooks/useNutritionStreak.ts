import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useNutritionStreak(calorieTarget: number) {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const calculate = useCallback(async () => {
    if (!user || calorieTarget <= 0) {
      setIsLoading(false);
      return;
    }

    // Fetch last 90 days of data to find streak
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const { data: rows, error } = await supabase
      .from("consumed_foods")
      .select("calories, logged_at")
      .eq("athlete_id", user.id)
      .gte("logged_at", startDate.toISOString())
      .lte("logged_at", endDate.toISOString());

    if (error) {
      setIsLoading(false);
      return;
    }

    // Aggregate calories by local date
    const dayTotals: Record<string, number> = {};
    (rows || []).forEach((r) => {
      if (!r.logged_at) return;
      const d = new Date(r.logged_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dayTotals[key] = (dayTotals[key] || 0) + (r.calories || 0);
    });

    // Count consecutive days from yesterday backwards (today is incomplete)
    let count = 0;
    for (let i = 1; i <= 90; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const total = dayTotals[key];
      if (total === undefined || total === 0) break;
      const adherence = (total / calorieTarget) * 100;
      if (adherence >= 85 && adherence <= 115) {
        count++;
      } else {
        break;
      }
    }

    setStreak(count);
    setIsLoading(false);
  }, [user, calorieTarget]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return { streak, isLoading, refetch: calculate };
}
