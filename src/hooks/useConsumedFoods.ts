import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ApiFoodItem {
  id: string;
  name: string;
  brand: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

export interface ConsumedFood {
  id: string;
  food_name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string | null;
  logged_at: string | null;
  planned_food_id: string | null;
}

const MEAL_TYPE_MAP: Record<string, string> = {
  kahvalti: "breakfast",
  ogle: "lunch",
  ara: "snack",
  aksam: "dinner",
};

const MEAL_TYPE_REVERSE: Record<string, string> = {
  breakfast: "kahvalti",
  lunch: "ogle",
  snack: "ara",
  dinner: "aksam",
};

export function useConsumedFoods() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<ConsumedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<ApiFoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch today's consumed foods
  const fetchToday = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const { data, error } = await supabase
      .from("consumed_foods")
      .select("*")
      .eq("athlete_id", user.id)
      .gte("logged_at", startOfDay.toISOString())
      .lte("logged_at", endOfDay.toISOString())
      .order("logged_at", { ascending: true });

    if (!error && data) {
      setFoods(data as ConsumedFood[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  // Search food via edge function
  const searchFood = useCallback(async (query: string, barcode?: string) => {
    if (!barcode && !query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const body = barcode ? { barcode } : { query: query.trim() };
      const { data, error } = await supabase.functions.invoke("search-food", {
        body,
      });
      if (error) throw error;
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Food search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Add food (API item macros are per 100g)
  const addFood = useCallback(
    async (food: ApiFoodItem, mealSlotId: string, grams: number) => {
      if (!user) return;
      const multiplier = grams / 100;
      const mealType = MEAL_TYPE_MAP[mealSlotId] || "snack";

      const row = {
        athlete_id: user.id,
        food_name: food.name,
        meal_type: mealType,
        calories: Math.round(food.calories * multiplier),
        protein: Math.round(food.protein * multiplier * 10) / 10,
        carbs: Math.round(food.carbs * multiplier * 10) / 10,
        fat: Math.round(food.fat * multiplier * 10) / 10,
        serving_size: `${grams}g`,
        api_food_id: food.id || null,
      };

      const { data, error } = await supabase
        .from("consumed_foods")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      if (data) setFoods((prev) => [...prev, data as ConsumedFood]);
      return data;
    },
    [user],
  );

  // Parse grams from serving string like "100g", "150 g", "200ml"
  const parseGrams = useCallback((str: string | null | undefined): number => {
    if (!str) return 100;
    const match = str.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) || 100 : 100;
  }, []);

  // Update consumed food serving & recalculate macros
  const updateFoodServing = useCallback(
    async (
      id: string,
      newGrams: number,
      originalGrams: number,
      originalMacros: { calories: number; protein: number; carbs: number; fat: number },
    ) => {
      const ratio = newGrams / originalGrams;
      const updated = {
        calories: Math.round(originalMacros.calories * ratio),
        protein: Math.round(originalMacros.protein * ratio * 10) / 10,
        carbs: Math.round(originalMacros.carbs * ratio * 10) / 10,
        fat: Math.round(originalMacros.fat * ratio * 10) / 10,
        consumed_serving: `${newGrams}g`,
        serving_size: `${newGrams}g`,
      };

      // Optimistic update
      setFoods((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, ...updated } : f,
        ),
      );

      const { error } = await supabase
        .from("consumed_foods")
        .update(updated)
        .eq("id", id);

      if (error) {
        // Revert on error
        await fetchToday();
        throw error;
      }
    },
    [fetchToday],
  );

  // Check a planned food (insert into consumed_foods with planned_food_id)
  const checkPlannedFood = useCallback(
    async (planned: {
      id: string;
      food_name: string;
      meal_type: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      serving_size: string | null;
    }) => {
      if (!user) return;

      const row = {
        athlete_id: user.id,
        food_name: planned.food_name,
        meal_type: planned.meal_type,
        calories: planned.calories,
        protein: planned.protein,
        carbs: planned.carbs,
        fat: planned.fat,
        serving_size: planned.serving_size,
        planned_food_id: planned.id,
        target_serving: planned.serving_size,
      };

      const { data, error } = await supabase
        .from("consumed_foods")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      if (data) setFoods((prev) => [...prev, data as ConsumedFood]);
      return data;
    },
    [user],
  );

  // Uncheck a planned food (delete the consumed_foods row by its id)
  const uncheckPlannedFood = useCallback(async (consumedFoodId: string) => {
    const { error } = await supabase.from("consumed_foods").delete().eq("id", consumedFoodId);
    if (error) throw error;
    setFoods((prev) => prev.filter((f) => f.id !== consumedFoodId));
  }, []);

  // Remove food
  const removeFood = useCallback(async (id: string) => {
    const { error } = await supabase.from("consumed_foods").delete().eq("id", id);
    if (error) throw error;
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Set of consumed planned_food_ids for quick lookup
  const consumedPlannedIds = useMemo(() => {
    const map = new Map<string, string>();
    foods.forEach((f) => {
      if (f.planned_food_id) {
        map.set(f.planned_food_id, f.id);
      }
    });
    return map;
  }, [foods]);

  // Group by meal slot id
  const groupedByMeal = useMemo(() => {
    const groups: Record<string, ConsumedFood[]> = {
      kahvalti: [],
      ogle: [],
      ara: [],
      aksam: [],
    };
    foods.forEach((f) => {
      const slotId = MEAL_TYPE_REVERSE[f.meal_type] || "ara";
      if (groups[slotId]) groups[slotId].push(f);
    });
    return groups;
  }, [foods]);

  // Daily totals
  const totals = useMemo(() => {
    return foods.reduce(
      (acc, f) => ({
        calories: acc.calories + (f.calories || 0),
        protein: acc.protein + (f.protein || 0),
        carbs: acc.carbs + (f.carbs || 0),
        fat: acc.fat + (f.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [foods]);

  return {
    foods,
    isLoading,
    searchResults,
    isSearching,
    searchFood,
    addFood,
    removeFood,
    checkPlannedFood,
    uncheckPlannedFood,
    updateFoodServing,
    parseGrams,
    consumedPlannedIds,
    groupedByMeal,
    totals,
    setSearchResults,
  };
}
