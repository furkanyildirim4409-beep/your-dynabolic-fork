import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ExerciseLastSession {
  exerciseName: string;
  sets: { weight: number; reps: number; isFailure?: boolean }[];
  maxWeight: number;
  date: string;
}

/**
 * Fetches last-session data for every exercise in the given workout
 * by scanning the most recent completed workout_log with matching workout_name.
 * Returns a Map keyed by exercise name.
 */
export const useExerciseHistory = (workoutName: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exercise-history", user?.id, workoutName],
    queryFn: async (): Promise<Map<string, ExerciseLastSession>> => {
      const map = new Map<string, ExerciseLastSession>();
      if (!user?.id || !workoutName) return map;

      const { data, error } = await supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("workout_name", workoutName)
        .eq("completed", true)
        .order("logged_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return map;

      const log = data[0];
      const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;

      if (Array.isArray(details)) {
        for (const d of details as any[]) {
          const name = d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;
          const sets = Array.isArray(d.sets)
            ? d.sets.map((s: any) => ({
                weight: Number(s.weight) || 0,
                reps: Number(s.reps) || 0,
                isFailure: s.isFailure ?? s.is_failure ?? false,
              }))
            : [];
          const maxWeight = sets.length > 0 ? Math.max(...sets.map((s: any) => s.weight)) : 0;
          map.set(name, {
            exerciseName: name,
            sets,
            maxWeight,
            date: log.logged_at ?? "",
          });
        }
      }

      return map;
    },
    enabled: !!user?.id && !!workoutName,
    staleTime: 5 * 60 * 1000,
  });
};
