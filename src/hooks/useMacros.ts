import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ResolvedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "coach" | "none";
}

/**
 * Fetches macro targets ONLY from nutrition_targets table (coach-assigned).
 * Returns null if no coach-assigned targets exist.
 */
export function useMacros(): ResolvedMacros | null {
  const { user } = useAuth();
  const [targets, setTargets] = useState<ResolvedMacros | null>(null);

  useEffect(() => {
    if (!user) {
      setTargets(null);
      return;
    }

    const fetch = async () => {
      const { data, error } = await supabase
        .from("nutrition_targets")
        .select("daily_calories, protein_g, carbs_g, fat_g")
        .eq("athlete_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setTargets(null);
        return;
      }

      setTargets({
        calories: data.daily_calories,
        protein: data.protein_g,
        carbs: data.carbs_g,
        fat: data.fat_g,
        source: "coach",
      });
    };

    fetch();
  }, [user]);

  return targets;
}
