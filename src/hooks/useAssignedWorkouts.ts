import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export interface WorkoutExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  rir?: number | null;
  failure_set?: boolean;
  restTime: string;
  notes: string | null;
  videoUrl: string | null;
}

export interface TransformedWorkout {
  id: string;
  title: string;
  day: string;
  exercises: number;
  duration: string;
  intensity: "Düşük" | "Orta" | "Yüksek";
  coachNote?: string;
  scheduledDate: string | null;
  programExercises: WorkoutExercise[];
}

export interface GroupedWorkouts {
  today: TransformedWorkout[];
  tomorrow: TransformedWorkout[];
  upcoming: TransformedWorkout[];
}

export const groupByDate = (workouts: TransformedWorkout[]): GroupedWorkouts => {
  const result: GroupedWorkouts = { today: [], tomorrow: [], upcoming: [] };

  for (const w of workouts) {
    if (!w.scheduledDate) {
      result.today.push(w);
      continue;
    }
    const date = parseISO(w.scheduledDate);
    if (isToday(date)) result.today.push(w);
    else if (isTomorrow(date)) result.tomorrow.push(w);
    else result.upcoming.push(w);
  }

  return result;
};

const parseExercises = (raw: any): WorkoutExercise[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((ex: any, i: number) => ({
    id: ex.id ?? `ex-${i}`,
    name: ex.name ?? "Bilinmeyen Hareket",
    sets: ex.sets ?? 3,
    reps: ex.reps ?? "10",
    rir: ex.rir ?? null,
    failure_set: ex.failure_set ?? false,
    restTime: ex.rest_time ?? "60s",
    notes: ex.notes ?? null,
    videoUrl: ex.video_url ?? null,
  }));
};

const estimateIntensity = (exercises: WorkoutExercise[]): "Düşük" | "Orta" | "Yüksek" => {
  const hasFailure = exercises.some((e) => e.failure_set);
  const avgRir = exercises.filter((e) => e.rir != null).reduce((a, e) => a + (e.rir ?? 2), 0) / (exercises.filter((e) => e.rir != null).length || 1);
  if (hasFailure || avgRir <= 1) return "Yüksek";
  if (avgRir <= 2) return "Orta";
  return "Düşük";
};

export const useAssignedWorkouts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assigned-workouts", user?.id],
    queryFn: async (): Promise<TransformedWorkout[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*")
        .eq("athlete_id", user.id)
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map((aw: any) => {
        const exercises = parseExercises(aw.exercises);
        const exerciseCount = exercises.length;
        const estimatedMinutes = exerciseCount * 10;
        const hours = Math.floor(estimatedMinutes / 60);
        const mins = estimatedMinutes % 60;
        const duration = hours > 0 ? `${hours}sa ${mins}dk` : `${mins}dk`;

        let dayLabel = "Bugün";
        if (aw.scheduled_date) {
          try {
            const d = parseISO(aw.scheduled_date);
            if (isToday(d)) dayLabel = "Bugün";
            else if (isTomorrow(d)) dayLabel = "Yarın";
            else {
              dayLabel = format(d, "EEEE, d MMMM", { locale: tr });
              dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
            }
          } catch {
            dayLabel = aw.scheduled_date;
          }
        }

        return {
          id: aw.id,
          title: aw.workout_name || "Antrenman",
          day: dayLabel,
          exercises: exerciseCount,
          duration,
          intensity: estimateIntensity(exercises),
          coachNote: aw.day_notes || undefined,
          scheduledDate: aw.scheduled_date ?? null,
          programExercises: exercises,
        };
      });
    },
    enabled: !!user?.id,
  });
};
