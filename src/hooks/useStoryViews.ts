import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useMyViewedStoryIds() {
  const { user } = useAuth();
  return useQuery<string[]>({
    queryKey: ["my-viewed-story-ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.story_id);
    },
    staleTime: 60_000,
  });
}

export function useMarkStoryViewed() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (storyIds: string[]) => {
      if (!user?.id || storyIds.length === 0) return;
      const rows = storyIds.map((sid) => ({ story_id: sid, viewer_id: user.id }));
      await supabase.from("story_views").upsert(rows, { onConflict: "story_id,viewer_id" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-viewed-story-ids"] });
    },
  });
}
