import { useState, useCallback } from "react";
export interface WeeklyRecapData { weekStartDate: string; weekEndDate: string; workoutsCompleted: number; streakDays: number; challengesWon: number; challengesLost: number; bioCoinsEarned: number; bonusCoinsEarned: number; totalTonnage: number; personalRecords: number; topExercise: string; comparedToLastWeek: { workouts: number; tonnage: number; streak: number; }; }
export const useWeeklyRecap = () => {
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<WeeklyRecapData | null>(null);
  const triggerRecap = useCallback(() => {
    setRecapData({ weekStartDate: "", weekEndDate: "", workoutsCompleted: 5, streakDays: 5, challengesWon: 2, challengesLost: 0, bioCoinsEarned: 600, bonusCoinsEarned: 100, totalTonnage: 12000, personalRecords: 1, topExercise: "Squat", comparedToLastWeek: { workouts: 20, tonnage: 15, streak: 2 } });
    setShowRecap(true);
  }, []);
  return { showRecap, recapData, triggerRecap, dismissRecap: useCallback(() => setShowRecap(false), []), getLastRecapData: useCallback(() => null, []) };
};