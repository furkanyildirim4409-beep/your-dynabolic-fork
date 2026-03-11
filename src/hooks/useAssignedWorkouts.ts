import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";

export interface TransformedExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  notes: string | null;
  videoUrl: string | null;
  rir?: number;
  rpe?: number;
  failureSet?: boolean;
  groupId?: string;
}

export interface TransformedWorkout {
  id: string;
  title: string;
  day: string;
  dayOfWeek: string | null;
  exercises: number;
  duration: string;
  intensity: "Düşük" | "Orta" | "Yüksek";
  coachNote?: string;
  programExercises: TransformedExercise[];
  completedToday: boolean;
}

const DAY_ORDER: Record<string, number> = {
  pazartesi: 1,
  salı: 2,
  çarşamba: 3,
  perşembe: 4,
  cuma: 5,
  cumartesi: 6,
  pazar: 7,
};

const mapDifficulty = (d: string | null): "Düşük" | "Orta" | "Yüksek" => {
  if (!d) return "Orta";
  const lower = d.toLowerCase();
  if (lower === "düşük" || lower === "easy" || lower === "low") return "Düşük";
  if (lower === "yüksek" || lower === "hard" || lower === "high") return "Yüksek";
  return "Orta";
};

export const useAssignedWorkouts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assigned-workouts", user?.id],
    queryFn: async (): Promise<TransformedWorkout[]> => {
      if (!user?.id) return [];

      // Fetch all assigned workouts (no status filter — recurring)
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*, programs(*, exercises(*))")
        .eq("athlete_id", user.id);

      if (error) throw error;
      if (!data) return [];

      // Fetch today's completed workout logs to mark completedToday
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const { data: todayLogs } = await supabase
        .from("workout_logs")
        .select("assigned_workout_id, workout_name")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("logged_at", todayStart)
        .lte("logged_at", todayEnd);

      const completedAssignmentIds = new Set(
        (todayLogs ?? [])
          .map((l: any) => l.assigned_workout_id)
          .filter(Boolean)
      );
      const completedWorkoutNames = new Set(
        (todayLogs ?? []).map((l: any) => l.workout_name).filter(Boolean)
      );

      const workouts = data.map((aw: any) => {
        const program = aw.programs;

        const inlineExercises = Array.isArray(aw.exercises) && aw.exercises.length > 0
          ? aw.exercises
          : null;
        const rawExercises = inlineExercises ?? (program?.exercises ?? []);
        const exerciseCount = rawExercises.length;
        const estimatedMinutes = exerciseCount * 10;
        const hours = Math.floor(estimatedMinutes / 60);
        const mins = estimatedMinutes % 60;
        const duration = hours > 0 ? `${hours}sa ${mins}dk` : `${mins}dk`;

        // Use day_of_week as primary label
        let dayLabel = aw.day_of_week ?? "Bugün";
        if (!aw.day_of_week && aw.scheduled_date) {
          try {
            dayLabel = format(new Date(aw.scheduled_date), "EEEE, d MMMM", { locale: tr });
            dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
          } catch {
            dayLabel = aw.scheduled_date;
          }
        }

        const title = aw.workout_name?.trim() ? aw.workout_name : (program?.title ?? "Antrenman");
        const coachNote = aw.day_notes?.trim() ? aw.day_notes : (program?.description || undefined);

        // Check if completed today
        const completedToday = completedAssignmentIds.has(aw.id) || completedWorkoutNames.has(title);

        return {
          id: aw.id,
          title,
          day: dayLabel,
          dayOfWeek: aw.day_of_week ?? null,
          exercises: exerciseCount,
          duration,
          intensity: mapDifficulty(program?.difficulty),
          coachNote,
          completedToday,
          programExercises: rawExercises
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ex: any) => ({
              id: ex.id ?? crypto.randomUUID(),
              name: ex.name,
              sets: ex.sets ?? 3,
              reps: ex.reps ?? "10",
              restTime: ex.rest_time ?? ex.restTime ?? "60s",
              notes: ex.notes ?? null,
              videoUrl: ex.video_url ?? ex.videoUrl ?? null,
              rir: typeof ex.rir === "number" ? ex.rir : undefined,
              rirPerSet: Array.isArray(ex.rir_per_set ?? ex.rirPerSet) ? (ex.rir_per_set ?? ex.rirPerSet) : undefined,
              rpe: typeof ex.rpe === "number" ? ex.rpe : undefined,
              failureSet: ex.failure_set === true || ex.failureSet === true,
              groupId: ex.group_id ?? ex.groupId ?? undefined,
            })),
        };
      });

      // Sort by day_of_week order
      workouts.sort((a, b) => {
        const orderA = a.dayOfWeek ? (DAY_ORDER[a.dayOfWeek.toLowerCase()] ?? 99) : 99;
        const orderB = b.dayOfWeek ? (DAY_ORDER[b.dayOfWeek.toLowerCase()] ?? 99) : 99;
        return orderA - orderB;
      });

      return workouts;
    },
    enabled: !!user?.id,
  });
};
