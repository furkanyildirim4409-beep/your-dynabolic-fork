import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface PlannedFood {
  id: string;
  food_name: string;
  meal_type: string;
  serving_size: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  day_number: number;
}

export interface DynamicTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  snack: 2,
  dinner: 3,
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle Yemeği",
  snack: "Ara Öğün",
  dinner: "Akşam Yemeği",
};

export function useDietPlan() {
  const { user } = useAuth();
  const [plannedFoods, setPlannedFoods] = useState<PlannedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTemplate, setHasTemplate] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);

      // 1. Get active_diet_template_id from nutrition_targets
      const { data: targets } = await supabase
        .from("nutrition_targets")
        .select("active_diet_template_id")
        .eq("athlete_id", user.id)
        .not("active_diet_template_id", "is", null)
        .limit(1)
        .maybeSingle();

      const templateId = targets?.active_diet_template_id;
      if (!templateId) {
        setHasTemplate(false);
        setPlannedFoods([]);
        setIsLoading(false);
        return;
      }

      // 2. Determine today's day number (Monday=1 ... Sunday=7)
      const day = new Date().getDay();
      const todayNum = day === 0 ? 7 : day;

      // 3. Fetch planned foods for today
      const { data: foods, error } = await supabase
        .from("diet_template_foods")
        .select("*")
        .eq("template_id", templateId)
        .eq("day_number", todayNum)
        .order("meal_type");

      if (error) {
        console.error("Diet plan fetch error:", error.message);
        setHasTemplate(false);
        setPlannedFoods([]);
      } else {
        setHasTemplate(true);
        setPlannedFoods(
          (foods || []).map((f) => ({
            id: f.id,
            food_name: f.food_name,
            meal_type: f.meal_type,
            serving_size: f.serving_size,
            calories: f.calories ?? 0,
            protein: Number(f.protein ?? 0),
            carbs: Number(f.carbs ?? 0),
            fat: Number(f.fat ?? 0),
            day_number: f.day_number ?? todayNum,
          }))
        );
      }

      setIsLoading(false);
    };

    fetch();
  }, [user]);

  // Dynamic targets = sum of today's planned foods
  const dynamicTargets = useMemo<DynamicTargets | null>(() => {
    if (!hasTemplate || plannedFoods.length === 0) return null;
    return plannedFoods.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [plannedFoods, hasTemplate]);

  // Group by meal_type for UI
  const groupedByMeal = useMemo(() => {
    const groups: Record<string, PlannedFood[]> = {};
    plannedFoods.forEach((f) => {
      if (!groups[f.meal_type]) groups[f.meal_type] = [];
      groups[f.meal_type].push(f);
    });
    // Sort by meal order
    const sorted = Object.entries(groups).sort(
      ([a], [b]) => (MEAL_ORDER[a] ?? 99) - (MEAL_ORDER[b] ?? 99)
    );
    return sorted;
  }, [plannedFoods]);

  return {
    plannedFoods,
    dynamicTargets,
    groupedByMeal,
    hasTemplate,
    isLoading,
    MEAL_LABELS,
  };
}
