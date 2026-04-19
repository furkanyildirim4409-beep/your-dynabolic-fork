import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
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
  const { user } = useAuth();
  return useQuery<CoachStoryRow[]>({
    queryKey: ["coach-stories", "followed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Get followed coach IDs
      const { data: follows, error: fErr } = await (supabase as any)
        .from("user_follows")
        .select("followed_id")
        .eq("follower_id", user!.id);
      if (fErr) throw fErr;
      const followedIds = (follows ?? []).map((f: any) => f.followed_id);
      if (followedIds.length === 0) return [];

      // 2. Fetch stories only from followed coaches
      const { data, error } = await (supabase as any)
        .from("coach_stories")
        .select("id, coach_id, media_url, expires_at, created_at, profiles!coach_id(full_name, avatar_url)")
        .in("coach_id", followedIds)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as any[]).map((s: any): CoachStoryRow => ({
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

// ── Leaderboard Coaches (RPC-driven, real math) ─────
export function useLeaderboardCoaches() {
  return useQuery<LeaderboardCoach[]>({
    queryKey: ["leaderboard-coaches", "v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_coach_leaderboard_v2");
      if (error) throw error;

      return ((data ?? []) as any[]).map((row): LeaderboardCoach => ({
        id: row.coach_id,
        name: row.full_name || "Koç",
        avatar: row.avatar_url || "",
        specialty: row.specialty || "Fitness",
        rating: 4.9,
        students: Number(row.student_count ?? 0),
        score: Number(row.calculated_score ?? 0),
        level: row.level ?? 1,
        hasNewStory: false,
      }));
    },
    staleTime: 120_000,
  });
}
