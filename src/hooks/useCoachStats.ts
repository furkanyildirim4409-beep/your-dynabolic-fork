import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CoachStats {
  studentCount: number;
  followerCount: number;
}

/**
 * Returns real student & follower counts for a coach.
 * - studentCount: profiles where coach_id = coachId (athletes assigned to this coach)
 * - followerCount: user_follows where followed_id = coachId
 */
export function useCoachStats(coachId?: string) {
  return useQuery<CoachStats>({
    queryKey: ["coach-stats", coachId],
    enabled: !!coachId,
    staleTime: 60_000,
    queryFn: async () => {
      const [studentsRes, followersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("coach_id", coachId!)
          .eq("role", "athlete"),
        (supabase as any)
          .from("user_follows")
          .select("id", { count: "exact", head: true })
          .eq("followed_id", coachId!),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (followersRes.error) throw followersRes.error;

      return {
        studentCount: studentsRes.count ?? 0,
        followerCount: followersRes.count ?? 0,
      };
    },
  });
}
