import React, { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useBadgeEngine, BadgeWithStatus } from "@/hooks/useBadgeEngine";
import type { LucideIcon } from "lucide-react";

export type AchievementTrigger =
  | "workout_complete" | "early_workout" | "streak_7" | "streak_30"
  | "heavy_lift_100kg" | "personal_record" | "daily_checkin"
  | "vision_ai_workout" | "first_workout" | "workout_count_100"
  | "challenge_streak_5" | "challenge_streak_10";

// UI-compatible Achievement type for the notification layer
export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: LucideIcon;
  tier: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  category?: string | null;
  requirement?: string;
}

interface AchievementContextType {
  pendingAchievement: Achievement | null;
  triggerAchievement: (trigger: AchievementTrigger) => void;
  dismissAchievement: () => void;
  unlockedAchievements: string[];
}

const AchievementContext = createContext<AchievementContextType | null>(null);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const { pendingBadge, dismissPendingBadge, checkAndUnlockBadges, badges } = useBadgeEngine();

  const pendingAchievement: Achievement | null = pendingBadge
    ? {
        id: pendingBadge.id,
        name: pendingBadge.name,
        description: pendingBadge.description,
        icon: pendingBadge.icon,
        tier: pendingBadge.tier || "bronze",
        unlocked: true,
        unlockedAt: pendingBadge.earned_at || undefined,
        xpReward: pendingBadge.xpReward,
        category: pendingBadge.category,
      }
    : null;

  const triggerAchievement = useCallback((_trigger: AchievementTrigger) => {
    // Fire-and-forget: evaluate all badge conditions
    checkAndUnlockBadges();
  }, [checkAndUnlockBadges]);

  const unlockedAchievements = badges.filter(b => b.unlocked).map(b => b.id);

  return React.createElement(AchievementContext.Provider, {
    value: {
      pendingAchievement,
      triggerAchievement,
      dismissAchievement: dismissPendingBadge,
      unlockedAchievements,
    },
  }, children);
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) throw new Error("useAchievements must be used within an AchievementProvider");
  return context;
};
