import { Dumbbell, Flame, Trophy, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ChallengeType = "pr" | "streak";
export type ChallengeStatus = "pending" | "accepted" | "active" | "completed" | "expired" | "declined";

export interface Challenge {
  id: string;
  type: ChallengeType;
  status: ChallengeStatus;
  challengerId: string;
  challengerName: string;
  challengerAvatar: string;
  challengerValue: number;
  challengedId: string;
  challengedName: string;
  challengedAvatar: string;
  challengedValue?: number;
  exercise?: string;
  targetValue: number;
  deadline: string;
  createdAt: string;
  bioCoinsReward: number;
  xpReward: number;
  winnerId?: string;
  completedAt?: string;
}

export const mockChallenges: Challenge[] = [
  { id: "ch1", type: "pr", status: "pending", challengerId: "1", challengerName: "Ahmet Yılmaz", challengerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", challengerValue: 140, challengedId: "current", challengedName: "Ahmet Kaya", challengedAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", exercise: "Bench Press", targetValue: 140, deadline: "2026-02-07", createdAt: "2026-01-30", bioCoinsReward: 500, xpReward: 100 },
  { id: "ch2", type: "streak", status: "pending", challengerId: "3", challengerName: "Zeynep Kaya", challengerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", challengerValue: 42, challengedId: "current", challengedName: "Ahmet Kaya", challengedAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", targetValue: 42, deadline: "2026-03-15", createdAt: "2026-01-29", bioCoinsReward: 750, xpReward: 150 },
  { id: "ch3", type: "pr", status: "active", challengerId: "current", challengerName: "Ahmet Kaya", challengerAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", challengerValue: 180, challengedId: "2", challengedName: "Mehmet Demir", challengedAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", challengedValue: 165, exercise: "Squat", targetValue: 180, deadline: "2026-02-10", createdAt: "2026-01-25", bioCoinsReward: 600, xpReward: 120 },
  { id: "ch4", type: "streak", status: "active", challengerId: "4", challengerName: "Burak Şahin", challengerAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", challengerValue: 35, challengedId: "current", challengedName: "Ahmet Kaya", challengedAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", challengedValue: 17, targetValue: 35, deadline: "2026-02-28", createdAt: "2026-01-20", bioCoinsReward: 800, xpReward: 180 },
  { id: "ch5", type: "pr", status: "completed", challengerId: "current", challengerName: "Ahmet Kaya", challengerAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", challengerValue: 200, challengedId: "5", challengedName: "Elif Çelik", challengedAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", challengedValue: 185, exercise: "Deadlift", targetValue: 200, deadline: "2026-01-28", createdAt: "2026-01-15", bioCoinsReward: 550, xpReward: 110, winnerId: "current", completedAt: "2026-01-27" },
];

export const getChallengeTypeIcon = (type: ChallengeType): LucideIcon => type === "pr" ? Dumbbell : Flame;
export const getChallengeTypeLabel = (type: ChallengeType): string => type === "pr" ? "PR Meydan Okuması" : "Seri Meydan Okuması";

export const getStatusLabel = (status: ChallengeStatus): string => {
  switch (status) {
    case "pending": return "Bekliyor";
    case "accepted": return "Kabul Edildi";
    case "active": return "Aktif";
    case "completed": return "Tamamlandı";
    case "expired": return "Süresi Doldu";
    case "declined": return "Reddedildi";
  }
};

export const getStatusColor = (status: ChallengeStatus): string => {
  switch (status) {
    case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "accepted": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "active": return "bg-primary/20 text-primary border-primary/30";
    case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "expired": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "declined": return "bg-muted text-muted-foreground border-white/10";
  }
};

export const prExercises = [
  { id: "squat", name: "Squat", icon: Dumbbell },
  { id: "bench", name: "Bench Press", icon: Dumbbell },
  { id: "deadlift", name: "Deadlift", icon: Dumbbell },
  { id: "ohp", name: "Overhead Press", icon: Dumbbell },
];