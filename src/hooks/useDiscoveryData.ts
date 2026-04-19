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

      const rawCoaches = (data ?? []) as any[];
      const coachIds = rawCoaches.map((c) => c.id);

      // Batch fetch real student counts (athletes whose profiles.coach_id = coach.id)
      const studentCountMap = new Map<string, number>();
      if (coachIds.length > 0) {
        const { data: athletes, error: aErr } = await supabase
          .from("profiles")
          .select("coach_id")
          .in("coach_id", coachIds)
          .eq("role", "athlete");
        if (aErr) throw aErr;
        (athletes ?? []).forEach((a: any) => {
          if (!a.coach_id) return;
          studentCountMap.set(a.coach_id, (studentCountMap.get(a.coach_id) ?? 0) + 1);
        });
      }

      const coaches: LeaderboardCoach[] = rawCoaches.map((p) => {
        const level = p.level ?? 1;
        const students = studentCountMap.get(p.id) ?? 0;
        return {
          id: p.id,
          name: p.full_name || "Koç",
          avatar: p.avatar_url || "",
          specialty: p.specialty || "Fitness",
          rating: 4.9,
          students,
          score: level * 1000 + students * 10,
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
