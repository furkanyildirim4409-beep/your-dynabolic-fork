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
  snack: "snack",
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
    const todayStart = format(new Date(), "yyyy-MM-dd") + "T00:00:00";
    const todayEnd = format(new Date(), "yyyy-MM-dd") + "T23:59:59";

    const { data, error } = await supabase
      .from("consumed_foods")
      .select("*")
      .eq("athlete_id", user.id)
      .gte("logged_at", todayStart)
      .lte("logged_at", todayEnd)
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
  const searchFood = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-food", {
        body: { query: query.trim() },
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

  // Remove food
  const removeFood = useCallback(async (id: string) => {
    const { error } = await supabase.from("consumed_foods").delete().eq("id", id);
    if (error) throw error;
    setFoods((prev) => prev.filter((f) => f.id !== id));
  }, []);

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
    groupedByMeal,
    totals,
    setSearchResults,
  };
}
