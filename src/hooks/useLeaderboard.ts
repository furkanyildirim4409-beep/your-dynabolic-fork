import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type LeaderboardMetric = "score" | "bioCoins" | "volume" | "streak";

export interface LeaderboardAthlete {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  bioCoins: number;
  volume: number;
  streak: number;
  level: number;
  score: number;
  isCurrentUser: boolean;
}

const calcScore = (xp: number, streak: number, volume: number) =>
  xp + streak * 50 + Math.round(volume / 10);

export const metricAccessor: Record<LeaderboardMetric, (a: LeaderboardAthlete) => number> = {
  score: (a) => a.score,
  bioCoins: (a) => a.bioCoins,
  volume: (a) => a.volume,
  streak: (a) => a.streak,
};

export const useLeaderboard = (metric: LeaderboardMetric = "score") => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, xp, streak, total_volume_kg, bio_coins, level")
        .eq("role", "athlete");

      if (error) throw error;
      return (data ?? []).map((p): LeaderboardAthlete => {
        const xp = p.xp ?? 0;
        const streak = p.streak ?? 0;
        const volume = Number(p.total_volume_kg ?? 0);
        const bioCoins = p.bio_coins ?? 0;
        return {
          id: p.id,
          name: p.full_name || "Atlet",
          avatar: p.avatar_url || "",
          xp,
          bioCoins,
          volume,
          streak,
          level: p.level ?? 1,
          score: calcScore(xp, streak, volume),
          isCurrentUser: p.id === user?.id,
        };
      });
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const sorted = [...(data ?? [])].sort(
    (a, b) => metricAccessor[metric](b) - metricAccessor[metric](a)
  );

  const currentUserRank = sorted.findIndex((a) => a.isCurrentUser) + 1;

  return { leaderboard: sorted, currentUserRank, isLoading };
};
