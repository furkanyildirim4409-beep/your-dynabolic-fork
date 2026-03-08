import { LucideIcon, Dumbbell, Sunrise, Flame, Trophy, Zap, Target, Calendar, Crown, Star, Award, Shield, Sparkles, Swords } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: LucideIcon;
  category: 'workout' | 'consistency' | 'strength' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  progressText?: string;
  xpReward: number;
}

export interface UserTier {
  name: string;
  level: number;
  minXP: number;
  maxXP: number;
  icon: LucideIcon;
  color: string;
  gradient: string;
}

export const userTiers: UserTier[] = [
  { name: "Standard", level: 1, minXP: 0, maxXP: 500, icon: Shield, color: "text-slate-400", gradient: "from-slate-500 to-slate-400" },
  { name: "Pro", level: 2, minXP: 500, maxXP: 1500, icon: Star, color: "text-primary", gradient: "from-primary to-emerald-500" },
  { name: "Elite", level: 3, minXP: 1500, maxXP: 3500, icon: Crown, color: "text-yellow-400", gradient: "from-yellow-500 to-amber-400" },
  { name: "Legend", level: 4, minXP: 3500, maxXP: 10000, icon: Sparkles, color: "text-purple-400", gradient: "from-purple-500 to-pink-500" },
];

export const achievements: Achievement[] = [
  { id: "early-bird", name: "Erken Kuş", description: "Sabahın köründe ter dök", requirement: "06:00'dan önce 10 antrenman tamamla", icon: Sunrise, category: "consistency", tier: "gold", unlocked: true, unlockedAt: "2024-01-15", xpReward: 150 },
  { id: "streak-7", name: "Haftalık Savaşçı", description: "Bir hafta boyunca hiç ara verme", requirement: "7 gün üst üste antrenman yap", icon: Flame, category: "consistency", tier: "silver", unlocked: true, unlockedAt: "2024-01-20", xpReward: 100 },
  { id: "streak-30", name: "Demir İrade", description: "Bir ay boyunca disiplini koru", requirement: "30 gün üst üste antrenman yap", icon: Flame, category: "consistency", tier: "platinum", unlocked: false, progress: 40, progressText: "12/30 gün", xpReward: 500 },
  { id: "consistency-king", name: "Tutarlılık Kralı", description: "Antrenman programına sadık kal", requirement: "Bir ayda %90 antrenman tamamlama oranı", icon: Crown, category: "consistency", tier: "gold", unlocked: false, progress: 75, progressText: "%75 tamamlama", xpReward: 200 },
  { id: "heavy-lifter", name: "Ağır Kaldırıcı", description: "Ciddi ağırlıklar taşı", requirement: "Tek bir harekette 100kg+ kaldır", icon: Dumbbell, category: "strength", tier: "gold", unlocked: true, unlockedAt: "2024-01-10", xpReward: 150 },
  { id: "pr-crusher", name: "Rekor Kırıcı", description: "Kendi sınırlarını aş", requirement: "5 farklı harekette kişisel rekor kır", icon: Trophy, category: "strength", tier: "silver", unlocked: false, progress: 60, progressText: "3/5 hareket", xpReward: 120 },
  { id: "tonnage-master", name: "Tonaj Ustası", description: "Toplam kaldırılan ağırlıkta zirveye ulaş", requirement: "Tek antrenmanda 10 ton toplam tonaj", icon: Zap, category: "strength", tier: "platinum", unlocked: false, progress: 85, progressText: "8.5t/10t", xpReward: 300 },
  { id: "first-workout", name: "İlk Adım", description: "Yolculuğun burada başlıyor", requirement: "İlk antrenmanını tamamla", icon: Target, category: "milestone", tier: "bronze", unlocked: true, unlockedAt: "2024-01-01", xpReward: 50 },
  { id: "century", name: "Yüzüncü Antrenman", description: "Üç haneli rakamlar kulübüne hoş geldin", requirement: "100 antrenman tamamla", icon: Award, category: "milestone", tier: "platinum", unlocked: false, progress: 45, progressText: "45/100 antrenman", xpReward: 400 },
  { id: "year-warrior", name: "Yıl Savaşçısı", description: "Bir yıl boyunca aktif kal", requirement: "365 gün boyunca en az 200 antrenman", icon: Calendar, category: "milestone", tier: "platinum", unlocked: false, progress: 12, progressText: "45/365 gün", xpReward: 1000 },
  { id: "vision-ai-pioneer", name: "Vision AI Öncüsü", description: "Geleceğin teknolojisini benimse", requirement: "Vision AI ile 10 antrenman tamamla", icon: Sparkles, category: "special", tier: "gold", unlocked: false, progress: 30, progressText: "3/10 antrenman", xpReward: 200 },
  { id: "challenge-streak-5", name: "Beşli Seri", description: "Meydan okumalarda seriye gir", requirement: "Art arda 5 meydan okuma kazan", icon: Swords, category: "special", tier: "gold", unlocked: false, progress: 0, progressText: "0/5 kazanç", xpReward: 250 },
  { id: "challenge-streak-10", name: "Efsane Savaşçı", description: "Meydan okumalarda yenilmez ol", requirement: "Art arda 10 meydan okuma kazan", icon: Crown, category: "special", tier: "platinum", unlocked: false, progress: 0, progressText: "0/10 kazanç", xpReward: 500 },
];

export const userGamificationStats = {
  currentXP: 875,
  totalXP: 2450,
  currentStreak: 12,
  longestStreak: 21,
  lastWorkoutDate: "2024-01-25",
  unlockedBadges: 4,
  totalBadges: achievements.length,
};

export const getCurrentTier = (xp: number): UserTier => {
  for (let i = userTiers.length - 1; i >= 0; i--) {
    if (xp >= userTiers[i].minXP) return userTiers[i];
  }
  return userTiers[0];
};

export const getNextTier = (xp: number): UserTier | null => {
  const currentTier = getCurrentTier(xp);
  const nextIndex = userTiers.findIndex(t => t.name === currentTier.name) + 1;
  return nextIndex < userTiers.length ? userTiers[nextIndex] : null;
};

export const getTierProgress = (xp: number): number => {
  const currentTier = getCurrentTier(xp);
  const nextTier = getNextTier(xp);
  if (!nextTier) return 100;
  const progressInTier = xp - currentTier.minXP;
  const tierRange = nextTier.minXP - currentTier.minXP;
  return Math.round((progressInTier / tierRange) * 100);
};

export const tierColors: Record<Achievement['tier'], { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: "bg-amber-900/30", border: "border-amber-700/50", text: "text-amber-600", glow: "shadow-amber-500/20" },
  silver: { bg: "bg-slate-400/20", border: "border-slate-400/50", text: "text-slate-300", glow: "shadow-slate-400/20" },
  gold: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", text: "text-yellow-400", glow: "shadow-yellow-500/30" },
  platinum: { bg: "bg-purple-500/20", border: "border-purple-400/50", text: "text-purple-300", glow: "shadow-purple-500/30" },
};