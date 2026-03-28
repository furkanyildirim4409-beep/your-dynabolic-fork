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

      // Use persisted calories when available, fallback to shared calculator
      let totalCalories = 0;
      for (const log of logs) {
        if ((log as any).calories_burned) {
          totalCalories += Number((log as any).calories_burned);
        } else {
          const logTonnage = log.tonnage ? Number(log.tonnage) : 0;
          const failureSets = countFailureSets(log.details as any[]);
          totalCalories += calculateWorkoutCalories(log.duration_minutes ?? 0, weightKg, logTonnage, failureSets);
        }
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
