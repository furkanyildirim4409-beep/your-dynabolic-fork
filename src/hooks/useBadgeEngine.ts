import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useXPEngine } from "@/hooks/useXPEngine";
import { toast } from "sonner";
import {
  Dumbbell, Sunrise, Flame, Trophy, Zap, Target, Calendar,
  Crown, Star, Award, Shield, Sparkles, Swords, Heart, Eye,
  Timer, Mountain, Rocket, Medal, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Sunrise, Flame, Trophy, Zap, Target, Calendar,
  Crown, Star, Award, Shield, Sparkles, Swords, Heart, Eye,
  Timer, Mountain, Rocket, Medal,
};

export const getIconByName = (name: string | null | undefined): LucideIcon => {
  if (!name) return Shield;
  return ICON_MAP[name] || Shield;
};

export interface BadgeWithStatus {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  category: string | null;
  tier: string | null;
  condition_type: string | null;
  condition_value: number | null;
  xp_reward: number | null;
  unlocked: boolean;
  earned_at: string | null;
  // Computed for UI compatibility
  icon: LucideIcon;
  xpReward: number;
  progress?: number;
  progressText?: string;
}

export const useBadgeEngine = () => {
  const { user, profile } = useAuth();
  const { awardXP } = useXPEngine();
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBadge, setPendingBadge] = useState<BadgeWithStatus | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    const [{ data: allBadges }, { data: earned }] = await Promise.all([
      supabase.from("badges").select("*"),
      supabase.from("athlete_badges").select("badge_id, earned_at").eq("athlete_id", user.id),
    ]);

    const earnedMap = new Map(
      (earned || []).map((e) => [e.badge_id, e.earned_at])
    );

    const merged: BadgeWithStatus[] = (allBadges || []).map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon_name: b.icon_name,
      category: b.category,
      tier: b.tier,
      condition_type: b.condition_type,
      condition_value: b.condition_value,
      xp_reward: b.xp_reward,
      unlocked: earnedMap.has(b.id),
      earned_at: earnedMap.get(b.id) || null,
      icon: getIconByName(b.icon_name),
      xpReward: b.xp_reward || 0,
    }));

    setBadges(merged);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const checkAndUnlockBadges = useCallback(async () => {
    if (!user?.id || !profile) return;

    // Gather live stats
    const [{ count: workoutCount }, { count: checkinCount }] = await Promise.all([
      supabase
        .from("assigned_workouts")
        .select("*", { count: "exact", head: true })
        .eq("athlete_id", user.id)
        .eq("status", "completed"),
      supabase
        .from("daily_checkins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const stats: Record<string, number> = {
      streak_days: profile.streak || 0,
      workout_count: workoutCount || 0,
      total_volume: Number(profile.total_volume_kg) || 0,
      checkin_count: checkinCount || 0,
    };

    // Get current earned set
    const { data: earned } = await supabase
      .from("athlete_badges")
      .select("badge_id")
      .eq("athlete_id", user.id);

    const earnedSet = new Set((earned || []).map((e) => e.badge_id));

    // Evaluate each unearned badge
    const { data: allBadges } = await supabase.from("badges").select("*");

    for (const badge of allBadges || []) {
      if (earnedSet.has(badge.id)) continue;
      if (!badge.condition_type || badge.condition_value == null) continue;

      const currentValue = stats[badge.condition_type] ?? 0;
      if (currentValue >= badge.condition_value) {
        // Unlock via server-side validated function
        const { data: awarded, error } = await supabase.rpc("award_badge_if_earned", {
          _badge_id: badge.id,
        });

        if (error) {
          console.error("Badge award error:", error);
          continue;
        }

        if (!awarded) continue;

        const xpReward = badge.xp_reward || 0;

        const unlockedBadge: BadgeWithStatus = {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon_name: badge.icon_name,
          category: badge.category,
          tier: badge.tier,
          condition_type: badge.condition_type,
          condition_value: badge.condition_value,
          xp_reward: badge.xp_reward,
          unlocked: true,
          earned_at: new Date().toISOString(),
          icon: getIconByName(badge.icon_name),
          xpReward: xpReward,
        };

        setPendingBadge(unlockedBadge);

        toast.success("Yeni Rozet Kazandın! 🏆", {
          description: `${badge.name} — +${xpReward} XP`,
        });

        earnedSet.add(badge.id);
      }
    }

    // Refresh badge list
    await fetchBadges();
  }, [user?.id, profile, awardXP, fetchBadges]);

  const dismissPendingBadge = useCallback(() => setPendingBadge(null), []);

  return {
    badges,
    isLoading,
    pendingBadge,
    dismissPendingBadge,
    checkAndUnlockBadges,
    refreshBadges: fetchBadges,
  };
};
