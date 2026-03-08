import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface NutritionLogFood {
  name: string;
  amount: string;
  cal: number;
  macros: { p: number; c: number; f: number };
  isEaten: boolean;
}

export interface NutritionLog {
  id: string;
  meal_name: string;
  foods: NutritionLogFood[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  logged_at: string;
}

function todayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useNutritionLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) { setLogs([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { start, end } = todayBounds();
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", start)
      .lt("logged_at", end)
      .order("logged_at", { ascending: true });

    if (error) {
      console.error("Nutrition logs fetch error:", error.message);
    } else {
      setLogs(
        (data || []).map((row) => ({
          id: row.id,
          meal_name: row.meal_name,
          foods: Array.isArray(row.foods) ? (row.foods as unknown as NutritionLogFood[]) : [],
          total_calories: Number(row.total_calories) || 0,
          total_protein: Number(row.total_protein) || 0,
          total_carbs: Number(row.total_carbs) || 0,
          total_fat: Number(row.total_fat) || 0,
          logged_at: row.logged_at || "",
        }))
      );
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const logMeal = async (
    mealName: string,
    foods: NutritionLogFood[],
  ) => {
    if (!user) return;
    const totalCal = foods.reduce((s, f) => s + f.cal, 0);
    const totalP = foods.reduce((s, f) => s + f.macros.p, 0);
    const totalC = foods.reduce((s, f) => s + f.macros.c, 0);
    const totalF = foods.reduce((s, f) => s + f.macros.f, 0);

    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: user.id,
      meal_name: mealName,
      foods: foods as unknown as Record<string, unknown>[],
      total_calories: totalCal,
      total_protein: totalP,
      total_carbs: totalC,
      total_fat: totalF,
    });

    if (error) {
      console.error("Nutrition log insert error:", error.message);
      throw error;
    }
    await fetchLogs();
  };

  return { logs, isLoading, refetch: fetchLogs, logMeal };
}

export function useNutritionHistory(days = 7) {
  const { user } = useAuth();
  const [history, setHistory] = useState<
    { date: string; dayLabel: string; calories: number; protein: number; carbs: number; fat: number; meals: number; adherence: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setHistory([]); setIsLoading(false); return; }

    const fetchHistory = async () => {
      setIsLoading(true);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", start.toISOString())
        .order("logged_at", { ascending: true });

      if (error) {
        console.error("Nutrition history fetch error:", error.message);
        setIsLoading(false);
        return;
      }

      const dayLabels = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
      const target = { calories: 2200, protein: 180, carbs: 250, fat: 70 };

      // Group by date
      const grouped: Record<string, { calories: number; protein: number; carbs: number; fat: number; meals: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        grouped[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 };
      }

      (data || []).forEach((row) => {
        const key = (row.logged_at || "").slice(0, 10);
        if (grouped[key]) {
          grouped[key].calories += Number(row.total_calories) || 0;
          grouped[key].protein += Number(row.total_protein) || 0;
          grouped[key].carbs += Number(row.total_carbs) || 0;
          grouped[key].fat += Number(row.total_fat) || 0;
          grouped[key].meals += 1;
        }
      });

      const result = Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, v]) => {
          const d = new Date(date + "T00:00:00");
          const calAdherence = v.calories > 0 ? Math.min(Math.round((v.calories / target.calories) * 100), 100) : 0;
          return {
            date,
            dayLabel: dayLabels[d.getDay()],
            calories: Math.round(v.calories),
            protein: Math.round(v.protein),
            carbs: Math.round(v.carbs),
            fat: Math.round(v.fat),
            meals: v.meals,
            adherence: calAdherence,
          };
        });

      setHistory(result);
      setIsLoading(false);
    };

    fetchHistory();
  }, [user, days]);

  return { history, isLoading };
}
