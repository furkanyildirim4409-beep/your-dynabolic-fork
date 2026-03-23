import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Star, Crown, Sparkles, Trophy, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface LevelThreshold {
  level: string;
  minXp: number;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: "Acemi", minXp: 0, icon: Shield, color: "text-slate-400", gradient: "from-slate-500 to-slate-400" },
  { level: "Amatör", minXp: 500, icon: Star, color: "text-primary", gradient: "from-primary to-emerald-500" },
  { level: "Pro", minXp: 1500, icon: Flame, color: "text-orange-400", gradient: "from-orange-500 to-amber-400" },
  { level: "Elite", minXp: 3000, icon: Crown, color: "text-yellow-400", gradient: "from-yellow-500 to-amber-400" },
  { level: "Şampiyon", minXp: 6000, icon: Trophy, color: "text-purple-400", gradient: "from-purple-500 to-pink-500" },
  { level: "Efsane", minXp: 10000, icon: Sparkles, color: "text-rose-400", gradient: "from-rose-500 to-red-500" },
];

export interface LevelInfo {
  currentLevel: string;
  nextLevel: string | null;
  progressPercent: number;
  xpRemaining: number;
  currentIcon: LucideIcon;
  currentColor: string;
  currentGradient: string;
  nextIcon: LucideIcon | null;
  nextColor: string | null;
}

export const calculateLevelInfo = (currentXp: number): LevelInfo => {
  let current = LEVEL_THRESHOLDS[0];
  let next: LevelThreshold | null = LEVEL_THRESHOLDS[1] || null;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (currentXp >= LEVEL_THRESHOLDS[i].minXp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || null;
      break;
    }
  }

  let progressPercent = 100;
  let xpRemaining = 0;

  if (next) {
    const xpIntoLevel = currentXp - current.minXp;
    const levelSize = next.minXp - current.minXp;
    progressPercent = Math.min(100, Math.max(0, (xpIntoLevel / levelSize) * 100));
    xpRemaining = next.minXp - currentXp;
  }

  return {
    currentLevel: current.level,
    nextLevel: next?.level || null,
    progressPercent,
    xpRemaining,
    currentIcon: current.icon,
    currentColor: current.color,
    currentGradient: current.gradient,
    nextIcon: next?.icon || null,
    nextColor: next?.color || null,
  };
};

export const useXPEngine = () => {
  const { user, profile, refreshProfile } = useAuth();

  const awardXP = useCallback(async (amount: number) => {
    if (!user?.id || !profile) return;

    const currentXp = profile.xp || 0;
    const newXp = currentXp + amount;

    await supabase
      .from("profiles")
      .update({ xp: newXp })
      .eq("id", user.id);

    await refreshProfile();
  }, [user?.id, profile, refreshProfile]);

  const levelInfo = calculateLevelInfo(profile?.xp || 0);

  return { awardXP, levelInfo, currentXP: profile?.xp || 0 };
};
