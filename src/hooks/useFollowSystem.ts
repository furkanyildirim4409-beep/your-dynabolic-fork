import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useFollowerCount(coachId: string | undefined) {
  return useQuery<number>({
    queryKey: ["follower-count", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("followed_id", coachId!);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30_000,
  });
}

export function useFollowStatus(coachId: string | undefined) {
  const { user } = useAuth();

  return useQuery<boolean>({
    queryKey: ["follow-status", coachId],
    enabled: !!coachId && !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("followed_id", coachId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    staleTime: 30_000,
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coachId, isCurrentlyFollowing }: { coachId: string; isCurrentlyFollowing: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isCurrentlyFollowing) {
        const { error } = await (supabase as any)
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("followed_id", coachId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("user_follows")
          .insert({ follower_id: user.id, followed_id: coachId });
        if (error) throw error;
      }
    },
    onMutate: async ({ coachId, isCurrentlyFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ["follow-status", coachId] });
      const previous = queryClient.getQueryData(["follow-status", coachId]);
      queryClient.setQueryData(["follow-status", coachId], !isCurrentlyFollowing);
      return { previous, coachId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(["follow-status", context.coachId], context.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", vars.coachId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", vars.coachId] });
    },
  });
}
