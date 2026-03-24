import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface TopExercise {
  name: string;
  maxWeight: number;
  count: number;
}

export const useTopExercises = () => {
  const { user } = useAuth();

  const topQuery = useQuery({
    queryKey: ["top-exercises", user?.id],
    queryFn: async (): Promise<TopExercise[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("workout_logs")
        .select("details")
        .eq("user_id", user.id)
        .eq("completed", true);

      if (error || !data) return [];

      const freq = new Map<string, { count: number; maxWeight: number }>();

      for (const log of data) {
        const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
        if (!Array.isArray(details)) continue;

        for (const d of details as any[]) {
          const name = d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;

          const existing = freq.get(name) || { count: 0, maxWeight: 0 };
          existing.count++;

          const sets = Array.isArray(d.sets) ? d.sets : [];
          for (const s of sets) {
            const w = Number(s.weight) || 0;
            if (w > existing.maxWeight) existing.maxWeight = w;
          }

          freq.set(name, existing);
        }
      }

      return Array.from(freq.entries())
        .map(([name, v]) => ({ name, maxWeight: v.maxWeight, count: v.count }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });

  const searchQuery = useQuery({
    queryKey: ["exercise-library-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_library")
        .select("name")
        .order("name");
      return (data ?? []).map((e) => e.name);
    },
    enabled: !!user,
    staleTime: 10 * 60_000,
  });

  return {
    topExercises: topQuery.data ?? [],
    allExercises: searchQuery.data ?? [],
    isLoading: topQuery.isLoading,
  };
};
