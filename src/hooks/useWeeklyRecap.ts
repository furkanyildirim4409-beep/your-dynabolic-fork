import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getIstanbulDateStr, getIstanbulDaysAgoStr } from "@/lib/timezone";

export interface WeekComparison {
  workouts: number;
  tonnage: number;
  streak: number;
  challenges: number;
  coins: number;
}

export interface PrevWeekRaw {
  workouts: number;
  tonnage: number;
  challengesWon: number;
  challengesLost: number;
  coins: number;
}

export interface WeeklyRecapData {
  weekStartDate: string;
  weekEndDate: string;
  workoutsCompleted: number;
  streakDays: number;
  challengesWon: number;
  challengesLost: number;
  bioCoinsEarned: number;
  bonusCoinsEarned: number;
  totalTonnage: number;
  personalRecords: number;
  topExercise: string;
  comparedToLastWeek: WeekComparison;
  previousWeek: PrevWeekRaw;
}

/** Parse workout_logs `details` JSONB to calculate total tonnage */
function calcTonnageFromLogs(logs: any[]): number {
  let total = 0;
  for (const log of logs) {
    const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
    if (!Array.isArray(details)) continue;
    for (const d of details) {
      const sets = Array.isArray(d.sets) ? d.sets : [];
      for (const s of sets) {
        const weight = Number(s.weight) || 0;
        const reps = Number(s.reps) || 0;
        total += weight * reps;
      }
    }
  }
  return total;
}

/** Parse workout_logs `details` JSONB to find the most frequent exercise */
function getTopExercise(logs: any[]): string {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const details = typeof log.details === "string" ? JSON.parse(log.details) : log.details;
    if (!Array.isArray(details)) continue;
    for (const d of details) {
      const name = d.exerciseName ?? d.exercise_name ?? "";
      if (name) counts[name] = (counts[name] || 0) + 1;
    }
  }
  let top = "";
  let max = 0;
  for (const [name, count] of Object.entries(counts)) {
    if (count > max) { max = count; top = name; }
  }
  return top || "—";
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const useWeeklyRecap = () => {
  const { user, profile } = useAuth();
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<WeeklyRecapData | null>(null);

  const triggerRecap = useCallback(async () => {
    if (!user?.id) return;

    const weekEndDate = getIstanbulDateStr();
    const weekStartDate = getIstanbulDaysAgoStr(7);
    const prevStartDate = getIstanbulDaysAgoStr(14);

    // Use ISO timestamps for timestamptz queries
    const weekEndISO = `${weekEndDate}T23:59:59.999+03:00`;
    const weekStartISO = `${weekStartDate}T00:00:00+03:00`;
    const prevStartISO = `${prevStartDate}T00:00:00+03:00`;

    // Parallel queries — using workout_logs (not assigned_workouts)
    const [thisWeekWk, prevWeekWk, challengesRes, prevChallengesRes, coinsRes, prevCoinsRes] = await Promise.all([
      supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("logged_at", weekStartISO)
        .lte("logged_at", weekEndISO),
      supabase
        .from("workout_logs")
        .select("details, logged_at")
        .eq("user_id", user.id)
        .eq("completed", true)
        .gte("logged_at", prevStartISO)
        .lt("logged_at", weekStartISO),
      supabase
        .from("challenges")
        .select("winner_id, challenger_id, opponent_id")
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .eq("status", "completed")
        .gte("created_at", weekStartISO),
      supabase
        .from("challenges")
        .select("winner_id, challenger_id, opponent_id")
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .eq("status", "completed")
        .gte("created_at", prevStartISO)
        .lt("created_at", weekStartISO),
      supabase
        .from("bio_coin_transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("created_at", weekStartISO),
      supabase
        .from("bio_coin_transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("created_at", prevStartISO)
        .lt("created_at", weekStartISO),
    ]);

    const thisLogs = thisWeekWk.data || [];
    const prevLogs = prevWeekWk.data || [];
    const challenges = challengesRes.data || [];
    const prevChallenges = prevChallengesRes.data || [];
    const coins = coinsRes.data || [];
    const prevCoins = prevCoinsRes.data || [];

    const workoutsCompleted = thisLogs.length;
    const prevWorkoutsCount = prevLogs.length;
    const totalTonnage = calcTonnageFromLogs(thisLogs);
    const prevTonnage = calcTonnageFromLogs(prevLogs);
    const topExercise = getTopExercise(thisLogs);

    const challengesWon = challenges.filter(c => c.winner_id === user.id).length;
    const challengesLost = challenges.filter(c => c.winner_id && c.winner_id !== user.id).length;
    const prevChallengesWon = prevChallenges.filter(c => c.winner_id === user.id).length;
    const prevChallengesLost = prevChallenges.filter(c => c.winner_id && c.winner_id !== user.id).length;

    const earnedCoins = coins.filter(c => c.amount > 0).reduce((s, c) => s + c.amount, 0);
    const bonusCoins = coins.filter(c => c.type === "bonus" || c.type === "challenge_win").reduce((s, c) => s + c.amount, 0);
    const prevEarnedCoins = prevCoins.filter(c => c.amount > 0).reduce((s, c) => s + c.amount, 0);

    const streakDays = profile?.streak || 0;

    setRecapData({
      weekStartDate,
      weekEndDate,
      workoutsCompleted,
      streakDays,
      challengesWon,
      challengesLost,
      bioCoinsEarned: earnedCoins,
      bonusCoinsEarned: bonusCoins,
      totalTonnage,
      personalRecords: 0,
      topExercise,
      comparedToLastWeek: {
        workouts: pctChange(workoutsCompleted, prevWorkoutsCount),
        tonnage: pctChange(totalTonnage, prevTonnage),
        streak: 0,
      },
    });
    setShowRecap(true);
  }, [user?.id, profile]);

  const dismissRecap = useCallback(() => setShowRecap(false), []);

  return { showRecap, recapData, triggerRecap, dismissRecap };
};
