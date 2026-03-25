import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";

export interface PREntry {
  id: string;
  name: string;
  estimated1RM: number;
  maxWeight: number;
  repsAtMax: number;
  date: string;
  dateFormatted: string;
  isRecent: boolean;
  history: { date: string; weight: number }[];
}

interface PRAccumulator {
  estimated1RM: number;
  maxWeight: number;
  repsAtMax: number;
  date: string;
  monthly: Map<string, number>; // "YYYY-MM" → max weight that month
}

export const usePRTracker = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["pr-tracker", user?.id],
    queryFn: async (): Promise<PREntry[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .order("logged_at", { ascending: false });

      if (error || !data) return [];

      const prMap = new Map<string, PRAccumulator>();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      for (const log of data) {
        const details =
          typeof log.details === "string"
            ? JSON.parse(log.details)
            : log.details;
        if (!Array.isArray(details)) continue;

        const logDate = log.logged_at ?? new Date().toISOString();
        const monthKey = logDate.slice(0, 7); // "YYYY-MM"

        for (const d of details as any[]) {
          const name: string =
            d.exerciseName ?? d.exercise_name ?? "";
          if (!name) continue;
          const sets = Array.isArray(d.sets) ? d.sets : [];

          for (const s of sets) {
            const w = Number(s.weight) || 0;
            const r = Number(s.reps) || 0;
            if (w <= 0) continue;

            const rawEpley = w * (1 + r / 30);
            const epley = Math.round(rawEpley / 2.5) * 2.5;
            const existing = prMap.get(name);

            if (!existing) {
              const monthly = new Map<string, number>();
              monthly.set(monthKey, epley);
              prMap.set(name, {
                estimated1RM: epley,
                maxWeight: w,
                repsAtMax: r,
                date: logDate,
                monthly,
              });
            } else {
              // Update monthly max (store estimated 1RM, not raw weight)
              const curMonthMax = existing.monthly.get(monthKey) ?? 0;
              if (epley > curMonthMax) existing.monthly.set(monthKey, epley);

              // Update all-time PR (by estimated 1RM)
              if (
                epley > existing.estimated1RM ||
                (epley === existing.estimated1RM && w > existing.maxWeight)
              ) {
                existing.estimated1RM = epley;
                existing.maxWeight = w;
                existing.repsAtMax = r;
                existing.date = logDate;
              }
            }
          }
        }
      }

      // Convert to sorted array
      const result: PREntry[] = [];
      prMap.forEach((acc, name) => {
        // Build sorted history from monthly map
        const sortedMonths = Array.from(acc.monthly.entries()).sort(
          (a, b) => a[0].localeCompare(b[0])
        );
        const history = sortedMonths.map(([monthStr, weight]) => {
          const d = new Date(monthStr + "-15");
          return {
            date: format(d, "MMM", { locale: tr }),
            weight,
          };
        });

        result.push({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          name,
          estimated1RM: acc.estimated1RM,
          maxWeight: acc.maxWeight,
          repsAtMax: acc.repsAtMax,
          date: acc.date,
          dateFormatted: format(new Date(acc.date), "d MMM yyyy", {
            locale: tr,
          }),
          isRecent: acc.date >= sevenDaysAgo,
          history,
        });
      });

      result.sort((a, b) => b.estimated1RM - a.estimated1RM);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const prList = query.data ?? [];

  // Big 3 total
  const big3Keywords: Record<string, string[]> = {
    squat: ["squat", "skuat"],
    bench: ["bench", "göğüs", "bench press"],
    deadlift: ["deadlift", "dead lift", "sırt çekme"],
  };

  const big3Total = Object.values(big3Keywords).reduce((sum, keywords) => {
    const match = prList.find((pr) =>
      keywords.some((kw) => pr.name.toLowerCase().includes(kw))
    );
    return sum + (match?.estimated1RM ?? 0);
  }, 0);

  return {
    prList,
    big3Total,
    isLoading: query.isLoading,
  };
};

/** Map exercise name to an emoji */
export const getExerciseEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("squat") || n.includes("skuat")) return "🏋️";
  if (n.includes("bench") || n.includes("göğüs")) return "💪";
  if (n.includes("deadlift") || n.includes("dead")) return "🔥";
  if (n.includes("press") || n.includes("omuz")) return "⬆️";
  if (n.includes("row") || n.includes("çek")) return "🚣";
  if (n.includes("curl")) return "💪";
  if (n.includes("leg") || n.includes("bacak")) return "🦵";
  return "🏋️";
};
