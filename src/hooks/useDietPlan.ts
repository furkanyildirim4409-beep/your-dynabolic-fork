import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { differenceInDays, startOfDay, parseISO } from "date-fns";

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
  const [allFoods, setAllFoods] = useState<PlannedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [dietStartDate, setDietStartDate] = useState<string | null>(null);
  const [dietDurationWeeks, setDietDurationWeeks] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);

      // 1. Get targets including temporal fields
      const { data: targets } = await supabase
        .from("nutrition_targets")
        .select("active_diet_template_id, diet_start_date, diet_duration_weeks")
        .eq("athlete_id", user.id)
        .not("active_diet_template_id", "is", null)
        .limit(1)
        .maybeSingle();

      const templateId = targets?.active_diet_template_id;
      if (!templateId) {
        setHasTemplate(false);
        setAllFoods([]);
        setDietStartDate(null);
        setDietDurationWeeks(null);
        setIsLoading(false);
        return;
      }

      setDietStartDate(targets.diet_start_date ?? null);
      setDietDurationWeeks(targets.diet_duration_weeks ?? null);

      // 2. Fetch ALL template foods (no day_number filter)
      const { data: foods, error } = await supabase
        .from("diet_template_foods")
        .select("*")
        .eq("template_id", templateId)
        .order("meal_type");

      if (error) {
        console.error("Diet plan fetch error:", error.message);
        setHasTemplate(false);
        setAllFoods([]);
      } else {
        setHasTemplate(true);
        setAllFoods(
          (foods || []).map((f) => ({
            id: f.id,
            food_name: f.food_name,
            meal_type: f.meal_type,
            serving_size: f.serving_size,
            calories: f.calories ?? 0,
            protein: Number(f.protein ?? 0),
            carbs: Number(f.carbs ?? 0),
            fat: Number(f.fat ?? 0),
            day_number: f.day_number ?? 1,
          }))
        );
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  // --- Temporal state calculations ---
  const temporalState = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = dietStartDate ? startOfDay(parseISO(dietStartDate)) : today;
    const durationWeeks = dietDurationWeeks || 4;

    const elapsedDays = differenceInDays(today, startDate);
    const isFuture = elapsedDays < 0;
    const isExpired = elapsedDays >= durationWeeks * 7;
    const isActive = !isFuture && !isExpired;

    const totalTemplateDays = allFoods.length > 0
      ? Math.max(1, ...allFoods.map((f) => f.day_number || 1))
      : 1;

    const currentDayNumber = isActive ? (elapsedDays % totalTemplateDays) + 1 : 1;

    return { isFuture, isExpired, isActive, currentDayNumber, totalTemplateDays };
  }, [allFoods, dietStartDate, dietDurationWeeks]);

  // --- STRICT GUARD: Only populate meals if active ---
  const plannedFoods = useMemo(() => {
    if (!temporalState.isActive || allFoods.length === 0) return [];
    return allFoods.filter((f) => (f.day_number || 1) === temporalState.currentDayNumber);
  }, [allFoods, temporalState]);

  // Dynamic targets = sum of today's planned foods (null if inactive)
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
    // New temporal exports
    isFuture: temporalState.isFuture,
    isExpired: temporalState.isExpired,
    currentDayNumber: temporalState.currentDayNumber,
    totalTemplateDays: temporalState.totalTemplateDays,
    dietStartDate,
  };
}
