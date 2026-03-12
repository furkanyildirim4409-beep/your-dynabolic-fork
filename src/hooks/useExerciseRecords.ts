import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface ExerciseRecord {
  name: string;
  performCount: number;
  maxWeight: number;
  repsAtMax: number;
  bestDate: string;
}

export const useExerciseRecords = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["exercise-records", user?.id],
    queryFn: async () => {
      if (!user?.id) return { top5Exercises: [], allExercises: [] };

      const { data, error } = await supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_at", { ascending: false });

      if (error || !data) return { top5Exercises: [], allExercises: [] };

      const map = new Map<string, ExerciseRecord>();
      // Track which workouts each exercise appeared in
      const workoutPresence = new Map<string, Set<number>>();

      for (let logIdx = 0; logIdx < data.length; logIdx++) {
        const log = data[logIdx];
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
        if (!Array.isArray(details)) continue;

        for (const d of details as any[]) {
          const name: string = d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;

          // Track unique workout appearances
          if (!workoutPresence.has(name)) workoutPresence.set(name, new Set());
          workoutPresence.get(name)!.add(logIdx);

          const sets = Array.isArray(d.sets) ? d.sets : [];
          for (const s of sets) {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            if (w <= 0) continue;

            const existing = map.get(name);
            if (!existing || w > existing.maxWeight || (w === existing.maxWeight && r > existing.repsAtMax)) {
              map.set(name, {
                name,
                performCount: 0, // will be set below
                maxWeight: w,
                repsAtMax: r,
                bestDate: log.logged_at ?? "",
              });
            }
          }

          // Ensure entry exists even if no weighted sets
          if (!map.has(name)) {
            map.set(name, {
              name,
              performCount: 0,
              maxWeight: 0,
              repsAtMax: 0,
              bestDate: log.logged_at ?? "",
            });
          }
        }
      }

      // Set performCount from workout presence
      for (const [name, workouts] of workoutPresence) {
        const record = map.get(name);
        if (record) record.performCount = workouts.size;
      }

      const allExercises = Array.from(map.values()).sort((a, b) => b.performCount - a.performCount);
      const top5Exercises = allExercises.slice(0, 5);

      return { top5Exercises, allExercises };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
