import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export interface WorkoutHistoryEntry {
  id: string;
  date: string;
  dateShort: string;
  name: string;
  duration: string;
  tonnage: string;
  exercises: number;
  bioCoins: number;
  completed: boolean;
  details: {
    exerciseName: string;
    sets: { weight: number; reps: number; isFailure?: boolean }[];
  }[];
}

export const useWorkoutHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workout-history", user?.id],
    queryFn: async (): Promise<WorkoutHistoryEntry[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data) return [];

      return data.map((log) => {
        const loggedAt = log.logged_at ? new Date(log.logged_at) : new Date();
        const durationMin = log.duration_minutes ?? 0;
        const tonnageKg = log.tonnage ?? 0;
        const tonnageStr = tonnageKg >= 1000
          ? `${(tonnageKg / 1000).toFixed(1)} Ton`
          : `${tonnageKg} kg`;

        // Parse details JSON — expected shape: array of { exerciseName, sets: [{weight, reps, isFailure?}] }
        let details: WorkoutHistoryEntry["details"] = [];
        if (log.details && Array.isArray(log.details)) {
          details = (log.details as any[]).map((d) => ({
            exerciseName: d.exerciseName ?? d.exercise_name ?? "Bilinmeyen",
            sets: Array.isArray(d.sets)
              ? d.sets.map((s: any) => ({
                  weight: s.weight ?? 0,
                  reps: s.reps ?? 0,
                  isFailure: s.isFailure ?? s.is_failure ?? false,
                }))
              : [],
          }));
        }

        return {
          id: log.id,
          date: format(loggedAt, "d MMMM yyyy", { locale: tr }),
          dateShort: format(loggedAt, "d MMM", { locale: tr }),
          name: log.workout_name,
          duration: durationMin >= 60
            ? `${Math.floor(durationMin / 60)}sa ${durationMin % 60}dk`
            : `${durationMin}dk`,
          tonnage: tonnageStr,
          exercises: log.exercises_count ?? details.length,
          bioCoins: log.bio_coins_earned ?? 0,
          completed: log.completed ?? true,
          details,
        };
      });
    },
    enabled: !!user?.id,
  });
};
