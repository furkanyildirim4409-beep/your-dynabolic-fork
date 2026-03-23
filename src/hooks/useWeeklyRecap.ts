import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  comparedToLastWeek: {
    workouts: number;
    tonnage: number;
    streak: number;
  };
}

function calcTonnageFromWorkouts(workouts: any[]): number {
  let total = 0;
  for (const w of workouts) {
    const exercises = w.exercises;
    if (!Array.isArray(exercises)) continue;
    for (const ex of exercises) {
      const sets = ex.sets || ex.loggedSets || [];
      if (!Array.isArray(sets)) continue;
      for (const s of sets) {
        const weight = Number(s.weight) || 0;
        const reps = Number(s.reps) || 0;
        total += weight * reps;
      }
    }
  }
  return total;
}

function getTopExercise(workouts: any[]): string {
  const counts: Record<string, number> = {};
  for (const w of workouts) {
    const exercises = w.exercises;
    if (!Array.isArray(exercises)) continue;
    for (const ex of exercises) {
      const name = ex.name || ex.exercise_name || "";
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

    const now = new Date();
    const weekEnd = now.toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const prevStart = new Date(now.getTime() - 14 * 86400000).toISOString();

    const weekStartDate = weekStart.slice(0, 10);
    const prevStartDate = prevStart.slice(0, 10);
    const weekEndDate = weekEnd.slice(0, 10);

    // Parallel queries
    const [thisWeekWk, prevWeekWk, challengesRes, coinsRes] = await Promise.all([
      supabase
        .from("assigned_workouts")
        .select("exercises")
        .eq("athlete_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", weekStartDate)
        .lte("scheduled_date", weekEndDate),
      supabase
        .from("assigned_workouts")
        .select("exercises")
        .eq("athlete_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", prevStartDate)
        .lt("scheduled_date", weekStartDate),
      supabase
        .from("challenges")
        .select("winner_id, challenger_id, opponent_id")
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .eq("status", "completed")
        .gte("created_at", weekStart),
      supabase
        .from("bio_coin_transactions")
        .select("amount, type")
        .eq("user_id", user.id)
        .gte("created_at", weekStart),
    ]);

    const thisWorkouts = thisWeekWk.data || [];
    const prevWorkouts = prevWeekWk.data || [];
    const challenges = challengesRes.data || [];
    const coins = coinsRes.data || [];

    const workoutsCompleted = thisWorkouts.length;
    const prevWorkoutsCount = prevWorkouts.length;
    const totalTonnage = calcTonnageFromWorkouts(thisWorkouts);
    const prevTonnage = calcTonnageFromWorkouts(prevWorkouts);
    const topExercise = getTopExercise(thisWorkouts);

    const challengesWon = challenges.filter(c => c.winner_id === user.id).length;
    const challengesLost = challenges.filter(c => c.winner_id && c.winner_id !== user.id).length;

    const earnedCoins = coins.filter(c => c.amount > 0).reduce((s, c) => s + c.amount, 0);
    const bonusCoins = coins.filter(c => c.type === "bonus" || c.type === "challenge_win").reduce((s, c) => s + c.amount, 0);

    const streakDays = profile?.streak || 0;
    const prevStreak = Math.max(0, streakDays - (streakDays > 0 ? pctChange(streakDays, streakDays) : 0));

    setRecapData({
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
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
