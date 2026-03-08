import { useState, useEffect, useCallback } from "react";
import { useAchievements } from "./useAchievements";
import { toast } from "@/hooks/use-toast";

export interface ChallengeStreakData {
  currentWinStreak: number;
  longestWinStreak: number;
  totalWins: number;
  totalLosses: number;
  totalChallenges: number;
  lastWinDate: string | null;
  bonusCoinsEarned: number;
}

export interface StreakMilestone {
  streak: number;
  name: string;
  emoji: string;
  bonusMultiplier: number;
}

const MILESTONES: StreakMilestone[] = [
  { streak: 3, name: "Üçleme", emoji: "🔥", bonusMultiplier: 1.5 },
  { streak: 5, name: "Beşli Seri", emoji: "⚡", bonusMultiplier: 2.0 },
  { streak: 7, name: "Haftalık Dominant", emoji: "👑", bonusMultiplier: 2.5 },
  { streak: 10, name: "Efsane Seri", emoji: "🏆", bonusMultiplier: 3.0 },
  { streak: 15, name: "Durdurulamaz", emoji: "💎", bonusMultiplier: 4.0 },
  { streak: 20, name: "Tanrı Modu", emoji: "🌟", bonusMultiplier: 5.0 },
];

const STORAGE_KEY = "dynabolic_challenge_streak";
const DEFAULT_DATA: ChallengeStreakData = {
  currentWinStreak: 0,
  longestWinStreak: 0,
  totalWins: 0,
  totalLosses: 0,
  totalChallenges: 0,
  lastWinDate: null,
  bonusCoinsEarned: 0,
};

export const useChallengeStreaks = () => {
  const [streakData, setStreakData] = useState<ChallengeStreakData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_DATA, ...JSON.parse(stored) } : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  const { triggerAchievement } = useAchievements();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
  }, [streakData]);

  const getCurrentMilestone = useCallback((): StreakMilestone | null => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (streakData.currentWinStreak >= MILESTONES[i].streak) {
        return MILESTONES[i];
      }
    }
    return null;
  }, [streakData.currentWinStreak]);

  const getNextMilestone = useCallback((): StreakMilestone | null => {
    for (const m of MILESTONES) {
      if (streakData.currentWinStreak < m.streak) return m;
    }
    return null;
  }, [streakData.currentWinStreak]);

  const calculateBonus = useCallback((baseReward: number, streak: number) => {
    let multiplier = 1;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (streak >= MILESTONES[i].streak) {
        multiplier = MILESTONES[i].bonusMultiplier;
        break;
      }
    }
    return { multiplier, total: Math.round(baseReward * multiplier) };
  }, []);

  const getWinRate = useCallback(() => {
    if (streakData.totalChallenges === 0) return 0;
    return Math.round((streakData.totalWins / streakData.totalChallenges) * 100);
  }, [streakData]);

  const recordWin = useCallback((baseCoinsReward: number) => {
    setStreakData(prev => {
      const newStreak = prev.currentWinStreak + 1;
      const bonus = calculateBonus(baseCoinsReward, newStreak);
      const bonusEarned = bonus.total - baseCoinsReward;
      return {
        ...prev,
        currentWinStreak: newStreak,
        longestWinStreak: Math.max(prev.longestWinStreak, newStreak),
        totalWins: prev.totalWins + 1,
        totalChallenges: prev.totalChallenges + 1,
        lastWinDate: new Date().toISOString(),
        bonusCoinsEarned: prev.bonusCoinsEarned + bonusEarned,
      };
    });
  }, [calculateBonus]);

  const recordLoss = useCallback(() => {
    setStreakData(prev => ({
      ...prev,
      currentWinStreak: 0,
      totalLosses: prev.totalLosses + 1,
      totalChallenges: prev.totalChallenges + 1,
    }));
  }, []);

  const resetStreak = useCallback(() => {
    setStreakData(DEFAULT_DATA);
    toast({ title: "Seri sıfırlandı", description: "Tüm meydan okuma verileri temizlendi." });
  }, []);

  const simulateWins = useCallback((count: number) => {
    setStreakData(prev => {
      const newStreak = prev.currentWinStreak + count;
      return {
        ...prev,
        currentWinStreak: newStreak,
        longestWinStreak: Math.max(prev.longestWinStreak, newStreak),
        totalWins: prev.totalWins + count,
        totalChallenges: prev.totalChallenges + count,
        lastWinDate: new Date().toISOString(),
      };
    });
    toast({ title: `+${count} kazanç simüle edildi`, description: `Seri: ${streakData.currentWinStreak + count}` });
  }, [streakData.currentWinStreak]);

  return {
    streakData,
    currentMilestone: getCurrentMilestone(),
    nextMilestone: getNextMilestone(),
    calculateBonus,
    getWinRate,
    recordWin,
    recordLoss,
    resetStreak,
    simulateWins,
  };
};
