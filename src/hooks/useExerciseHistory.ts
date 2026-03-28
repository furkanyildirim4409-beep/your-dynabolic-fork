import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ExerciseGlobalPR {
  maxWeight: number;
  repsAtMax: number;
  date: string;
}

/**
 * Fetches the global all-time Personal Record for every exercise
 * across ALL workout logs (not filtered by workout name).
 * Returns a Map keyed by exercise name.
 */
export interface ExerciseHistoryResult {
  prMap: Map<string, ExerciseGlobalPR>;
  lastUsedWeights: Map<string, number>;
}

export const useExerciseHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exercise-global-pr", user?.id],
    queryFn: async (): Promise<ExerciseHistoryResult> => {
      const prMap = new Map<string, ExerciseGlobalPR>();
      const lastUsedWeights = new Map<string, number>();
      if (!user?.id) return { prMap, lastUsedWeights };

      const { data, error } = await supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_at", { ascending: false });

      if (error || !data) return { prMap, lastUsedWeights };

      for (const log of data) {
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
        if (!Array.isArray(details)) continue;

        for (const d of details as any[]) {
          const name = d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;
          const sets = Array.isArray(d.sets) ? d.sets : [];

          // 1. Last Used Weight: take the LAST valid set weight (reverse scan)
          if (!lastUsedWeights.has(name) && sets.length > 0) {
            for (let i = sets.length - 1; i >= 0; i--) {
              const w = Number(sets[i].weight) || 0;
              if (w > 0) {
                lastUsedWeights.set(name, w);
                break;
              }
            }
          }

          // 2. PR tracking (forward loop)
          for (const s of sets) {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            if (w <= 0) continue;
            const existing = prMap.get(name);
            if (!existing || w > existing.maxWeight || (w === existing.maxWeight && r > existing.repsAtMax)) {
              prMap.set(name, {
                maxWeight: w,
                repsAtMax: r,
                date: log.logged_at ?? "",
              });
            }
          }
        }
      }

      return { prMap, lastUsedWeights };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
