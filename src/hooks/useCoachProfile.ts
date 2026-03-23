import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface CoachProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  specialty: string | null;
  gym_name: string | null;
}

export function useCoachProfile() {
  const { profile } = useAuth();
  const coachId = profile?.coach_id;

  return useQuery({
    queryKey: ["coach-profile", coachId],
    queryFn: async (): Promise<CoachProfile | null> => {
      if (!coachId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, specialty, gym_name")
        .eq("id", coachId)
        .single();
      if (error) {
        console.error("Coach profile fetch error:", error.message);
        return null;
      }
      return data;
    },
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000,
  });
}
