import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
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
}

export interface TransformedWorkout {
  id: string;
  title: string;
  day: string;
  exercises: number;
  duration: string;
  intensity: "Düşük" | "Orta" | "Yüksek";
  coachNote?: string;
  programExercises: TransformedExercise[];
}

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

      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*, programs(*, exercises(*))")
        .eq("athlete_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      if (!data) return [];

      return data.map((aw: any) => {
        const program = aw.programs;
        const exercises = program?.exercises ?? [];
        const exerciseCount = exercises.length;
        const estimatedMinutes = exerciseCount * 10;
        const hours = Math.floor(estimatedMinutes / 60);
        const mins = estimatedMinutes % 60;
        const duration = hours > 0 ? `${hours}sa ${mins}dk` : `${mins}dk`;

        let dayLabel = "Bugün";
        if (aw.scheduled_date) {
          try {
            dayLabel = format(new Date(aw.scheduled_date), "EEEE, d MMMM", { locale: tr });
            dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
          } catch {
            dayLabel = aw.scheduled_date;
          }
        }

        return {
          id: aw.id,
          title: program?.title ?? "Antrenman",
          day: dayLabel,
          exercises: exerciseCount,
          duration,
          intensity: mapDifficulty(program?.difficulty),
          coachNote: program?.description || undefined,
          programExercises: exercises
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ex: any) => ({
              id: ex.id,
              name: ex.name,
              sets: ex.sets ?? 3,
              reps: ex.reps ?? "10",
              restTime: ex.rest_time ?? "60s",
              notes: ex.notes,
              videoUrl: ex.video_url,
            })),
        };
      });
    },
    enabled: !!user?.id,
  });
};
