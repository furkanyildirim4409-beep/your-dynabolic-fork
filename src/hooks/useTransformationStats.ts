import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { differenceInMonths, differenceInWeeks, differenceInDays } from "date-fns";

export interface TransformationStats {
  weightDiff: string | null;
  fatDiff: string | null;
  timeElapsed: string | null;
  hasEnoughData: boolean;
  loading: boolean;
  firstDate: string | null;
  latestDate: string | null;
}

function formatTimeDiff(first: Date, now: Date): string {
  const months = differenceInMonths(now, first);
  if (months >= 1) return `${months} Ay`;
  const weeks = differenceInWeeks(now, first);
  if (weeks >= 1) return `${weeks} Hafta`;
  const days = differenceInDays(now, first);
  return `${Math.max(1, days)} Gün`;
}

function formatDiff(val: number, unit: string): string {
  const sign = val > 0 ? "+" : "";
  return `${sign}${Math.round(val * 10) / 10}${unit}`;
}

export function useTransformationStats(): TransformationStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<TransformationStats>({
    weightDiff: null,
    fatDiff: null,
    timeElapsed: null,
    hasEnoughData: false,
    loading: true,
    firstDate: null,
    latestDate: null,
  });

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setStats(s => ({ ...s, loading: false }));
      return;
    }

    try {
      // Fetch first & latest weight logs in parallel
      const [firstWeightRes, latestWeightRes, firstBmRes, latestBmRes] = await Promise.all([
        supabase
          .from("weight_logs")
          .select("weight_kg, logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("weight_logs")
          .select("weight_kg, logged_at")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("body_measurements")
          .select("body_fat_pct, logged_at")
          .eq("user_id", user.id)
          .not("body_fat_pct", "is", null)
          .order("logged_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("body_measurements")
          .select("body_fat_pct, logged_at")
          .eq("user_id", user.id)
          .not("body_fat_pct", "is", null)
          .order("logged_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const firstW = firstWeightRes.data;
      const latestW = latestWeightRes.data;
      const firstBm = firstBmRes.data;
      const latestBm = latestBmRes.data;

      // Need at least 2 weight entries on different dates
      const hasWeight = firstW && latestW && firstW.logged_at !== latestW.logged_at;
      const hasFat = firstBm && latestBm && firstBm.logged_at !== latestBm.logged_at;

      if (!hasWeight && !hasFat) {
        setStats(s => ({ ...s, loading: false, hasEnoughData: false }));
        return;
      }

      // Determine earliest date for time elapsed
      const dates: Date[] = [];
      if (firstW?.logged_at) dates.push(new Date(firstW.logged_at));
      if (firstBm?.logged_at) dates.push(new Date(firstBm.logged_at));
      const earliestDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;

      setStats({
        weightDiff: hasWeight
          ? formatDiff(Number(latestW.weight_kg) - Number(firstW.weight_kg), "kg")
          : null,
        fatDiff: hasFat
          ? formatDiff(Number(latestBm.body_fat_pct) - Number(firstBm.body_fat_pct), "%")
          : null,
        timeElapsed: earliestDate ? formatTimeDiff(earliestDate, new Date()) : null,
        hasEnoughData: true,
        loading: false,
        firstDate: earliestDate?.toISOString() ?? null,
        latestDate: new Date().toISOString(),
      });
    } catch (err) {
      console.error("useTransformationStats error:", err);
      setStats(s => ({ ...s, loading: false }));
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return stats;
}
