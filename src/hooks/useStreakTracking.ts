import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useStreakTracking = () => {
  const { user, profile, refreshProfile } = useAuth();

  const currentStreak = profile?.streak || 0;
  const longestStreak = profile?.longest_streak || 0;
  const lastActivityDate = profile?.last_activity_date || null;

  const today = new Date().toLocaleDateString("en-CA");
  const isStreakActive = lastActivityDate === today;

  const updateStreak = useCallback(async () => {
    if (!user?.id || !profile) return;

    const todayStr = new Date().toLocaleDateString("en-CA");
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString("en-CA");

    const lastActive = profile.last_activity_date;

    if (lastActive === todayStr) return; // Already counted today

    let newStreak = 1;
    if (lastActive === yesterdayStr) {
      newStreak = (profile.streak || 0) + 1;
    }

    const newLongest = Math.max(profile.longest_streak || 0, newStreak);

    await supabase
      .from("profiles")
      .update({
        streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: todayStr,
      })
      .eq("id", user.id);

    await refreshProfile();
  }, [user?.id, profile, refreshProfile]);

  return {
    currentStreak,
    longestStreak,
    isStreakActive,
    updateStreak,
  };
};
