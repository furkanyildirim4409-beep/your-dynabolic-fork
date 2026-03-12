import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface SetDetail {
  weight: number;
  reps: number;
  rir?: number;
  isFailure?: boolean;
}

export interface WorkoutHistory {
  date: string;
  sets: SetDetail[];
}

export interface ExerciseRecord {
  name: string;
  performCount: number;
  maxWeight: number;
  repsAtMax: number;
  bestDate: string;
  history: WorkoutHistory[];
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
      const workoutPresence = new Map<string, Set<number>>();
      const historyMap = new Map<string, WorkoutHistory[]>();

      for (let logIdx = 0; logIdx < data.length; logIdx++) {
        const log = data[logIdx];
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
        if (!Array.isArray(details)) continue;

        for (const d of details as any[]) {
          const name: string = d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;

          if (!workoutPresence.has(name)) workoutPresence.set(name, new Set());
          workoutPresence.get(name)!.add(logIdx);

          const sets = Array.isArray(d.sets) ? d.sets : [];
          const setsForHistory: SetDetail[] = [];

          for (const s of sets) {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            const rir = s.rir != null ? Number(s.rir) : undefined;
            const isFailure = s.isFailure ?? s.failure ?? false;

            setsForHistory.push({ weight: w, reps: r, rir, isFailure });

            if (w <= 0) continue;

            const existing = map.get(name);
            if (!existing || w > existing.maxWeight || (w === existing.maxWeight && r > existing.repsAtMax)) {
              map.set(name, {
                name,
                performCount: 0,
                maxWeight: w,
                repsAtMax: r,
                bestDate: log.logged_at ?? "",
                history: [],
              });
            }
          }

          // Add to history
          if (setsForHistory.length > 0) {
            if (!historyMap.has(name)) historyMap.set(name, []);
            historyMap.get(name)!.push({
              date: log.logged_at ?? "",
              sets: setsForHistory,
            });
          }

          if (!map.has(name)) {
            map.set(name, {
              name,
              performCount: 0,
              maxWeight: 0,
              repsAtMax: 0,
              bestDate: log.logged_at ?? "",
              history: [],
            });
          }
        }
      }

      for (const [name, workouts] of workoutPresence) {
        const record = map.get(name);
        if (record) record.performCount = workouts.size;
      }

      // Attach history
      for (const [name, history] of historyMap) {
        const record = map.get(name);
        if (record) record.history = history;
      }

      const allExercises = Array.from(map.values()).sort((a, b) => b.performCount - a.performCount);
      const top5Exercises = allExercises.slice(0, 5);

      return { top5Exercises, allExercises };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};
