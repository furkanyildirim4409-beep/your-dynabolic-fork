import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CoachFollower {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Returns the list of users following a given coach.
 * Powers the future "Takipçiler" modal on the Coach Profile page.
 */
export function useCoachFollowers(coachId?: string) {
  return useQuery<CoachFollower[]>({
    queryKey: ["coach-followers", coachId],
    enabled: !!coachId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_follows")
        .select("follower_id, profiles!follower_id(id, full_name, avatar_url)")
        .eq("followed_id", coachId!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as any[])
        .map((row: any) => row.profiles)
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          full_name: p.full_name ?? "Kullanıcı",
          avatar_url: p.avatar_url ?? null,
        }));
    },
  });
}
