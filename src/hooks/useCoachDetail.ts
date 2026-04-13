import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { SocialPost, CoachProduct } from "@/types/shared-models";
import type { CoachStoryRow } from "@/hooks/useDiscoveryData";

// ── Coach Profile ───────────────────────────────────
export interface CoachDetailProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialty: string | null;
  gym_name: string | null;
}

export function useCoachDetail(coachId: string | undefined) {
  return useQuery<CoachDetailProfile | null>({
    queryKey: ["coach-detail", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, specialty, gym_name")
        .eq("id", coachId!)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 300_000,
  });
}

// ── Coach Posts ──────────────────────────────────────
export function useCoachPosts(coachId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<SocialPost[]>({
    queryKey: ["coach-posts", coachId, userId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data: posts, error } = await (supabase as any)
        .from("social_posts")
        .select("*, profiles!coach_id(full_name, avatar_url)")
        .eq("coach_id", coachId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p: any) => p.id);

      const { data: likes } = await (supabase as any)
        .from("post_likes")
        .select("id, post_id, user_id")
        .in("post_id", postIds);

      const likesArr = (likes ?? []) as { id: string; post_id: string; user_id: string }[];
      const countMap = new Map<string, number>();
      const userLikedSet = new Set<string>();

      for (const like of likesArr) {
        countMap.set(like.post_id, (countMap.get(like.post_id) ?? 0) + 1);
        if (userId && like.user_id === userId) userLikedSet.add(like.post_id);
      }

      return (posts as any[]).map((p): SocialPost => ({
        id: p.id,
        coach_id: p.coach_id,
        content: p.content,
        type: p.type,
        before_image_url: p.before_image_url,
        after_image_url: p.after_image_url,
        video_thumbnail_url: p.video_thumbnail_url,
        video_url: p.video_url,
        created_at: p.created_at,
        coach: {
          full_name: p.profiles?.full_name ?? "Koç",
          avatar_url: p.profiles?.avatar_url ?? null,
        },
        likes_count: countMap.get(p.id) ?? 0,
        user_has_liked: userLikedSet.has(p.id),
      }));
    },
    staleTime: 60_000,
  });
}

// ── Coach Products ──────────────────────────────────
export function useCoachDetailProducts(coachId: string | undefined) {
  return useQuery<CoachProduct[]>({
    queryKey: ["coach-detail-products", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_products")
        .select("*")
        .eq("coach_id", coachId!)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id,
        coach_id: row.coach_id,
        title: row.title,
        description: row.description ?? null,
        price: Number(row.price),
        image_url: row.image_url,
        is_active: row.is_active,
        created_at: row.created_at,
      }));
    },
    staleTime: 300_000,
  });
}

// ── Coach-Specific Stories ──────────────────────────
export function useCoachSpecificStories(coachId: string | undefined) {
  return useQuery<CoachStoryRow[]>({
    queryKey: ["coach-stories", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("coach_stories")
        .select("id, coach_id, media_url, expires_at, created_at, profiles!coach_id(full_name, avatar_url)")
        .eq("coach_id", coachId!)
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
