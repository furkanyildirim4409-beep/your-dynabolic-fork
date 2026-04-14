import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { SocialPost } from "@/types/shared-models";

// ── Row types (until types.ts auto-regenerates) ─────
interface SocialPostRow {
  id: string;
  coach_id: string;
  content: string;
  type: string;
  before_image_url: string | null;
  after_image_url: string | null;
  video_thumbnail_url: string | null;
  video_url: string | null;
  created_at: string;
}

interface PostLikeRow {
  id: string;
  post_id: string;
  user_id: string;
}

// ── Fetch hook ──────────────────────────────────────
export function useSocialPosts() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<SocialPost[]>({
    queryKey: ["social-posts", userId],
    queryFn: async () => {
      // 1. Fetch posts with coach profile join
      const { data: posts, error: postsError } = await (supabase as any)
        .from("social_posts")
        .select("*, profiles!coach_id(full_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p: any) => p.id);

      // 2. Fetch all likes for these posts in one query
      const { data: likes, error: likesError } = await (supabase as any)
        .from("post_likes")
        .select("id, post_id, user_id")
        .in("post_id", postIds);

      if (likesError) throw likesError;

      // 3. Aggregate client-side
      const likesArr = (likes ?? []) as PostLikeRow[];
      const countMap = new Map<string, number>();
      const userLikedSet = new Set<string>();

      for (const like of likesArr) {
        countMap.set(like.post_id, (countMap.get(like.post_id) ?? 0) + 1);
        if (userId && like.user_id === userId) {
          userLikedSet.add(like.post_id);
        }
      }

      // 4. Map to SocialPost[]
      return (posts as any[]).map((p): SocialPost => ({
        id: p.id,
        coach_id: p.coach_id,
        content: p.content,
        type: p.type,
        before_image_url: p.before_image_url,
        after_image_url: p.after_image_url,
        video_thumbnail_url: p.video_thumbnail_url,
        video_url: p.video_url,
        image_url: p.image_url ?? null,
        created_at: p.created_at,
        coach: {
          full_name: p.profiles?.full_name ?? "Koç",
          avatar_url: p.profiles?.avatar_url ?? null,
        },
        likes_count: countMap.get(p.id) ?? 0,
        user_has_liked: userLikedSet.has(p.id),
      }));
    },
  });
}

// ── Toggle-like mutation with optimistic UI ─────────
interface ToggleLikeVars {
  postId: string;
  isCurrentlyLiked: boolean;
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }: ToggleLikeVars) => {
      if (!userId) throw new Error("Not authenticated");

      if (isCurrentlyLiked) {
        const { error } = await (supabase as any)
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },

    onMutate: async ({ postId, isCurrentlyLiked }) => {
      const queryKey = ["social-posts", userId];
      await queryClient.cancelQueries({ queryKey });

      const previousPosts = queryClient.getQueryData<SocialPost[]>(queryKey);

      queryClient.setQueryData<SocialPost[]>(queryKey, (old) =>
        old?.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes_count: post.likes_count + (isCurrentlyLiked ? -1 : 1),
                user_has_liked: !isCurrentlyLiked,
              }
            : post
        )
      );

      return { previousPosts };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["social-posts", userId], context.previousPosts);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts", userId] });
    },
  });
}
