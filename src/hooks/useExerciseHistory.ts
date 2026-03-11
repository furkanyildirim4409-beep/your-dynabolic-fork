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
export const useExerciseHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exercise-global-pr", user?.id],
    queryFn: async (): Promise<Map<string, ExerciseGlobalPR>> => {
      const map = new Map<string, ExerciseGlobalPR>();
      if (!user?.id) return map;

      const { data, error } = await supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_at", { ascending: false });

      if (error || !data) return map;

      for (const log of data) {
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
        if (!Array.isArray(details)) continue;

        for (const d of details as any[]) {
          const name = d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;
          const sets = Array.isArray(d.sets) ? d.sets : [];

          for (const s of sets) {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            if (w <= 0) continue;

            const existing = map.get(name);
            if (!existing || w > existing.maxWeight || (w === existing.maxWeight && r > existing.repsAtMax)) {
              map.set(name, {
                maxWeight: w,
                repsAtMax: r,
                date: log.logged_at ?? "",
              });
            }
          }
        }
      }

      return map;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
