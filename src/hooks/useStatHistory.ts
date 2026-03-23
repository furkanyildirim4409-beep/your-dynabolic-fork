import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type StatType = "sleep" | "calories" | "water";
type TrendDirection = "up" | "down" | "stable";

export interface HistoryPoint {
  day: string;
  value: number;
}

export interface StatHistoryResult {
  history: HistoryPoint[];
  average: number;
  todayValue: number;
  trendPercent: number;
  trendDirection: TrendDirection;
  isLoading: boolean;
}

const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function getDayLabel(date: Date): string {
  return DAY_LABELS[date.getDay()];
}

function buildDateRange(period: number): { start: Date; end: Date; dates: string[] } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (period - 1));

  const dates: string[] = [];
  for (let i = 0; i < period; i++) {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return { start, end, dates };
}

function computeTrend(history: HistoryPoint[]): { trendPercent: number; trendDirection: TrendDirection } {
  const len = history.length;
  const half = Math.floor(len / 2);
  const recentHalf = history.slice(half);
  const olderHalf = history.slice(0, half);

  const recentAvg = recentHalf.reduce((s, h) => s + h.value, 0) / (recentHalf.length || 1);
  const olderAvg = olderHalf.reduce((s, h) => s + h.value, 0) / (olderHalf.length || 1);

  if (olderAvg === 0) return { trendPercent: 0, trendDirection: "stable" };

  const pct = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  const dir: TrendDirection = pct > 2 ? "up" : pct < -2 ? "down" : "stable";
  return { trendPercent: Math.abs(pct), trendDirection: dir };
}

async function fetchSleepHistory(userId: string, start: Date, end: Date, dates: string[]) {
  const { data } = await supabase
    .from("daily_checkins")
    .select("sleep_hours, created_at")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: true });

  const byDate = new Map<string, number>();
  (data || []).forEach((r) => {
    if (r.created_at && r.sleep_hours != null) {
      const key = r.created_at.split("T")[0];
      byDate.set(key, Number(r.sleep_hours));
    }
  });

  return dates.map((d) => ({
    day: getDayLabel(new Date(d)),
    value: Math.round((byDate.get(d) || 0) * 10) / 10,
  }));
}

async function fetchCaloriesHistory(userId: string, start: Date, end: Date, dates: string[]) {
  const { data } = await supabase
    .from("consumed_foods")
    .select("calories, logged_at")
    .eq("athlete_id", userId)
    .gte("logged_at", start.toISOString())
    .lte("logged_at", end.toISOString());

  const byDate = new Map<string, number>();
  (data || []).forEach((r) => {
    if (r.logged_at) {
      const key = r.logged_at.split("T")[0];
      byDate.set(key, (byDate.get(key) || 0) + (r.calories || 0));
    }
  });

  return dates.map((d) => ({
    day: getDayLabel(new Date(d)),
    value: Math.round(byDate.get(d) || 0),
  }));
}

async function fetchWaterHistory(userId: string, start: Date, end: Date, dates: string[]) {
  const { data } = await supabase
    .from("water_logs")
    .select("amount_ml, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", start.toISOString())
    .lte("logged_at", end.toISOString());

  const byDate = new Map<string, number>();
  (data || []).forEach((r) => {
    if (r.logged_at) {
      const key = r.logged_at.split("T")[0];
      byDate.set(key, (byDate.get(key) || 0) + (r.amount_ml || 0));
    }
  });

  return dates.map((d) => ({
    day: getDayLabel(new Date(d)),
    value: Math.round(((byDate.get(d) || 0) / 1000) * 10) / 10, // ml -> L
  }));
}

export function useStatHistory(statType: StatType | null, period: "7" | "30"): StatHistoryResult {
  const { user } = useAuth();
  const periodNum = Number(period);

  const { data, isLoading } = useQuery({
    queryKey: ["stat-history", statType, period, user?.id],
    queryFn: async () => {
      if (!user?.id || !statType) return null;
      const { start, end, dates } = buildDateRange(periodNum);

      let history: HistoryPoint[];
      switch (statType) {
        case "sleep":
          history = await fetchSleepHistory(user.id, start, end, dates);
          break;
        case "calories":
          history = await fetchCaloriesHistory(user.id, start, end, dates);
          break;
        case "water":
          history = await fetchWaterHistory(user.id, start, end, dates);
          break;
        default:
          history = [];
      }

      const nonZero = history.filter((h) => h.value > 0);
      const average = nonZero.length > 0
        ? Math.round((nonZero.reduce((s, h) => s + h.value, 0) / nonZero.length) * 10) / 10
        : 0;

      const todayValue = history.length > 0 ? history[history.length - 1].value : 0;
      const { trendPercent, trendDirection } = computeTrend(history);

      return { history, average, todayValue, trendPercent, trendDirection };
    },
    enabled: !!user?.id && !!statType,
    staleTime: 3 * 60 * 1000,
  });

  return {
    history: data?.history || [],
    average: data?.average || 0,
    todayValue: data?.todayValue || 0,
    trendPercent: data?.trendPercent || 0,
    trendDirection: data?.trendDirection || "stable",
    isLoading,
  };
}
