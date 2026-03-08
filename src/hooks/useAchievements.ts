import React, { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { Achievement, achievements as allAchievements } from "@/lib/gamificationData";

export type AchievementTrigger = 
  | "workout_complete" | "early_workout" | "streak_7" | "streak_30"
  | "heavy_lift_100kg" | "personal_record" | "daily_checkin"
  | "vision_ai_workout" | "first_workout" | "workout_count_100"
  | "challenge_streak_5" | "challenge_streak_10";

const triggerToAchievementMap: Record<AchievementTrigger, string[]> = {
  workout_complete: ["first-workout"], early_workout: ["early-bird"],
  streak_7: ["streak-7"], streak_30: ["streak-30"],
  heavy_lift_100kg: ["heavy-lifter"], personal_record: ["pr-crusher"],
  daily_checkin: ["consistency-king"], vision_ai_workout: ["vision-ai-pioneer"],
  first_workout: ["first-workout"], workout_count_100: ["century"],
  challenge_streak_5: ["challenge-streak-5"], challenge_streak_10: ["challenge-streak-10"],
};

const checkAchievementUnlock = (achievementId: string): boolean => {
  const achievement = allAchievements.find(a => a.id === achievementId);
  if (!achievement || achievement.unlocked) return false;
  return false;
};

interface AchievementContextType {
  pendingAchievement: Achievement | null;
  triggerAchievement: (trigger: AchievementTrigger) => void;
  showDemoAchievement: () => void;
  dismissAchievement: () => void;
  unlockedAchievements: string[];
}

const AchievementContext = createContext<AchievementContextType | null>(null);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    const stored = localStorage.getItem("unlockedAchievements");
    return stored ? JSON.parse(stored) : allAchievements.filter(a => a.unlocked).map(a => a.id);
  });

  const dismissAchievement = useCallback(() => setPendingAchievement(null), []);

  const triggerAchievement = useCallback((trigger: AchievementTrigger) => {
    const achievementIds = triggerToAchievementMap[trigger] || [];
    achievementIds.forEach(id => {
      if (unlockedAchievements.includes(id)) return;
      if (checkAchievementUnlock(id)) {
        const achievement = allAchievements.find(a => a.id === id);
        if (achievement) {
          setPendingAchievement({ ...achievement, unlocked: true, unlockedAt: new Date().toISOString() });
          setUnlockedAchievements(prev => {
            const updated = [...prev, id];
            localStorage.setItem("unlockedAchievements", JSON.stringify(updated));
            return updated;
          });
        }
      }
    });
  }, [unlockedAchievements]);

  const showDemoAchievement = useCallback(() => {
    setPendingAchievement({
      id: "demo", name: "Haftalık Savaşçı", description: "Bir hafta boyunca hiç ara verme",
      requirement: "7 gün üst üste antrenman yap", icon: allAchievements[0].icon,
      category: "consistency", tier: "silver", unlocked: true,
      unlockedAt: new Date().toISOString(), xpReward: 100,
    });
  }, []);

  return React.createElement(AchievementContext.Provider, {
    value: { pendingAchievement, triggerAchievement, showDemoAchievement, dismissAchievement, unlockedAchievements }
  }, children);
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) throw new Error("useAchievements must be used within an AchievementProvider");
  return context;
};