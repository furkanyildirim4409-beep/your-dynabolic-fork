import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LeaderboardCoach } from "@/types/shared-models";

// ── Coach Stories ───────────────────────────────────
export interface CoachStoryRow {
  id: string;
  coach_id: string;
  media_url: string;
  expires_at: string;
  created_at: string;
  coach: { full_name: string; avatar_url: string | null };
}

export function useCoachStories() {
  return useQuery<CoachStoryRow[]>({
    queryKey: ["coach-stories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("coach_stories")
        .select("id, coach_id, media_url, expires_at, created_at, profiles!coach_id(full_name, avatar_url)")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as any[]).map((s): CoachStoryRow => ({
        id: s.id,
        coach_id: s.coach_id,
        media_url: s.media_url,
        expires_at: s.expires_at,
        created_at: s.created_at,
        coach: {
          full_name: s.profiles?.full_name ?? "Koç",
          avatar_url: s.profiles?.avatar_url ?? null,
        },
      }));
    },
    staleTime: 60_000,
  });
}

// ── Leaderboard Coaches ─────────────────────────────
export function useLeaderboardCoaches() {
  return useQuery<LeaderboardCoach[]>({
    queryKey: ["leaderboard-coaches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, specialty, level")
        .eq("role", "coach");

      if (error) throw error;

      const coaches: LeaderboardCoach[] = ((data ?? []) as any[]).map((p) => {
        const level = p.level ?? 1;
        return {
          id: p.id,
          name: p.full_name || "Koç",
          avatar: p.avatar_url || "",
          specialty: p.specialty || "Fitness",
          rating: 4.9,
          students: 0,
          score: level * 1000 + Math.floor(Math.random() * 500),
          level,
          hasNewStory: false,
        };
      });

      coaches.sort((a, b) => b.score - a.score);
      return coaches;
    },
    staleTime: 120_000,
  });
}
