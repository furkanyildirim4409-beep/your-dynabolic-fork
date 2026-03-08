import { useState, useEffect, useCallback } from "react";
import { useAchievements } from "./useAchievements";
import { toast } from "@/hooks/use-toast";

export interface ChallengeStreakData { currentWinStreak: number; longestWinStreak: number; totalWins: number; totalLosses: number; totalChallenges: number; lastWinDate: string | null; bonusCoinsEarned: number; }
const STORAGE_KEY = "dynabolic_challenge_streak";
const DEFAULT_DATA: ChallengeStreakData = { currentWinStreak: 0, longestWinStreak: 0, totalWins: 0, totalLosses: 0, totalChallenges: 0, lastWinDate: null, bonusCoinsEarned: 0 };

export const useChallengeStreaks = () => {
  const [streakData, setStreakData] = useState<ChallengeStreakData>(() => {
    try { const stored = localStorage.getItem(STORAGE_KEY); return stored ? { ...DEFAULT_DATA, ...JSON.parse(stored) } : DEFAULT_DATA; } catch { return DEFAULT_DATA; }
  });
  const { triggerAchievement } = useAchievements();
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData)); }, [streakData]);
  const recordWin = useCallback((baseCoinsReward: number) => { setStreakData(prev => ({ ...prev, currentWinStreak: prev.currentWinStreak + 1, totalWins: prev.totalWins + 1, totalChallenges: prev.totalChallenges + 1, lastWinDate: new Date().toISOString() })); }, []);
  const recordLoss = useCallback(() => { setStreakData(prev => ({ ...prev, currentWinStreak: 0, totalLosses: prev.totalLosses + 1, totalChallenges: prev.totalChallenges + 1 })); }, []);
  return { streakData, recordWin, recordLoss };
};