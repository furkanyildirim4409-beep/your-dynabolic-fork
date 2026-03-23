import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface TodayCheckinData {
  id: string;
  mood: number | null;
  sleep: number | null;
  soreness: number | null;
  stress: number | null;
  digestion: number | null;
  sleep_hours: number | null;
  notes: string | null;
  created_at: string | null;
}

export function useTodayCheckin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["today-checkin", user?.id],
    queryFn: async (): Promise<TodayCheckinData | null> => {
      if (!user?.id) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_checkins")
        .select("id, mood, sleep, soreness, stress, digestion, sleep_hours, notes, created_at")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59.999`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Today checkin fetch error:", error.message);
        return null;
      }
      return data as TodayCheckinData | null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
