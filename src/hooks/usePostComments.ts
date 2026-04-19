import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function usePostComments(postId: string | null) {
  return useQuery<PostComment[]>({
    queryKey: ["post-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      if (!postId) return [];
      // Two-step fetch: no FK between post_comments.user_id and profiles.id
      const { data: rows, error } = await (supabase as any)
        .from("post_comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const comments = (rows ?? []) as any[];
      const userIds = Array.from(new Set(comments.map((c) => c.user_id))).filter(Boolean);
      let profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.id] = {
            full_name: p.full_name ?? "Kullanıcı",
            avatar_url: p.avatar_url ?? null,
          };
        });
      }
      return comments.map((row): PostComment => ({
        id: row.id,
        post_id: row.post_id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        author: profileMap[row.user_id] ?? { full_name: "Kullanıcı", avatar_url: null },
      }));
    },
  });
}

export function usePostCommentsCount(postId: string) {
  return useQuery<number>({
    queryKey: ["post-comments-count", postId],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("post_comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase as any)
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select("id, post_id, user_id, content, created_at")
        .single();
      if (error) {
        console.error("[useAddComment] insert failed:", error);
        throw error;
      }
      return data;
    },
    onMutate: async ({ postId, content }) => {
      await queryClient.cancelQueries({ queryKey: ["post-comments", postId] });
      const previous = queryClient.getQueryData<PostComment[]>(["post-comments", postId]);
      const previousCount = queryClient.getQueryData<number>(["post-comments-count", postId]);
      const optimistic: PostComment = {
        id: `optimistic-${Date.now()}`,
        post_id: postId,
        user_id: user?.id ?? "",
        content,
        created_at: new Date().toISOString(),
        author: {
          full_name: profile?.full_name ?? "Sen",
          avatar_url: profile?.avatar_url ?? null,
        },
      };
      queryClient.setQueryData<PostComment[]>(["post-comments", postId], (old) => [...(old ?? []), optimistic]);
      queryClient.setQueryData<number>(["post-comments-count", postId], (old) => (old ?? 0) + 1);
      return { previous, previousCount };
    },
    onError: (_e, vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["post-comments", vars.postId], ctx.previous);
      if (ctx?.previousCount !== undefined)
        queryClient.setQueryData(["post-comments-count", vars.postId], ctx.previousCount);
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["post-comments-count", vars.postId] });
    },
  });
}
