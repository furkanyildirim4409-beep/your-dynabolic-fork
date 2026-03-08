import { useState, useCallback } from "react";
import { useAchievements } from "./useAchievements";
export const useStreakTracking = () => {
  const { triggerAchievement } = useAchievements();
  const [streakData] = useState({ currentStreak: 12, longestStreak: 21, lastWorkoutDate: new Date().toISOString().split("T")[0], totalWorkouts: 45 });
  return { ...streakData, isStreakActive: true, recordWorkout: useCallback(() => {}, []), simulateStreak: useCallback(() => {}, []), resetStreak: useCallback(() => {}, []) };
};