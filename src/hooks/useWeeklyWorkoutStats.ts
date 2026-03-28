import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { startOfWeek, endOfWeek } from "date-fns";
import { calculateWorkoutCalories, countFailureSets } from "@/lib/workout";

interface WeeklyWorkoutStats {
  completedCount: number;
  totalDurationHours: string;
  totalCalories: string;
}

export const useWeeklyWorkoutStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weekly-workout-stats", user?.id],
    queryFn: async (): Promise<WeeklyWorkoutStats> => {
      if (!user?.id) return { completedCount: 0, totalDurationHours: "0sa", totalCalories: "0" };

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Fetch weight and workout logs in parallel
      const [profileRes, logsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("current_weight")
          .eq("id", user.id)
          .single(),
        supabase
          .from("workout_logs")
          .select("duration_minutes, details, tonnage")
          .eq("user_id", user.id)
          .eq("completed", true)
          .gte("logged_at", weekStart.toISOString())
          .lte("logged_at", weekEnd.toISOString()),
      ]);

      const weightKg = profileRes.data?.current_weight ?? 75;
      const logs = logsRes.data ?? [];

      const completedCount = logs.length;
      const totalMinutes = logs.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);

      // Dynamic calorie algorithm: Base MET + EPOC intensity bonus
      let totalCalories = 0;
      for (const log of logs) {
        const durationHours = (log.duration_minutes ?? 0) / 60;
        const baseBurn = durationHours * weightKg * 5.0; // MET 5.0 for resistance training

        let failureSets = 0;
        if (log.details && Array.isArray(log.details)) {
          for (const exercise of log.details as any[]) {
            if (Array.isArray(exercise.sets)) {
              for (const set of exercise.sets) {
                if (set.isFailure === true || set.is_failure === true || set.rir === 0) {
                  failureSets++;
                }
              }
            }
          }
        }

        const epocBonus = failureSets * 15; // +15 kcal per failure/RIR-0 set
        const logTonnage = log.tonnage ? Number(log.tonnage) : 0;
        const mechanicalBonus = (logTonnage / 1000) * 20; // +20 kcal per 1,000 kg lifted
        totalCalories += baseBurn + epocBonus + mechanicalBonus;
      }

      // Format duration
      const hours = totalMinutes / 60;
      const durationStr = hours >= 1
        ? `${hours.toFixed(1).replace(/\.0$/, "")}sa`
        : `${totalMinutes}dk`;

      // Format calories with locale separator
      const caloriesStr = Math.round(totalCalories).toLocaleString("tr-TR");

      return { completedCount, totalDurationHours: durationStr, totalCalories: caloriesStr };
    },
    enabled: !!user?.id,
  });
};
