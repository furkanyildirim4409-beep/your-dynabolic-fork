import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface BodyMeasurement {
  id: string;
  user_id: string | null;
  neck: number | null;
  chest: number | null;
  shoulder: number | null;
  waist: number | null;
  hips: number | null;
  arm: number | null;
  thigh: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  logged_at: string | null;
}

export interface MeasurementInput {
  neck?: number | null;
  chest?: number | null;
  shoulder?: number | null;
  waist?: number | null;
  hips?: number | null;
  arm?: number | null;
  thigh?: number | null;
  body_fat_pct?: number | null;
  muscle_mass_kg?: number | null;
}

/** U.S. Navy BF% formula — gender-aware, default height 175cm */
export function calcNavyBodyFat(
  waist: number,
  neck: number,
  height = 175,
  gender: "male" | "female" = "male",
  hips?: number | null,
): number | null {
  if (waist <= 0 || neck <= 0 || height <= 0) return null;

  let denominator: number;

  if (gender === "female") {
    if (!hips || hips <= 0) return null;
    const sum = waist + hips - neck;
    if (sum <= 0) return null;
    denominator = 1.29579 - 0.35004 * Math.log10(sum) + 0.221 * Math.log10(height);
  } else {
    const diff = waist - neck;
    if (diff <= 0) return null;
    denominator = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height);
  }

  if (denominator <= 0) return null;

  const bf = 495 / denominator - 450;
  if (!isFinite(bf) || isNaN(bf)) return null;

  const clamped = Math.max(bf, 2);
  if (clamped > 60) return null;

  return Math.round(clamped * 10) / 10;
}

/** Estimate Lean Body Mass (LBM) from weight and body fat % */
export function calcMuscleMass(weightKg: number, bodyFatPct: number): number | null {
  if (weightKg <= 0 || bodyFatPct <= 0 || bodyFatPct >= 100) return null;
  const lbm = weightKg * (1 - bodyFatPct / 100);
  if (lbm <= 0) return null;
  return Math.round(lbm * 10) / 10;
}

/** Mifflin-St Jeor BMR (kcal/day) */
export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" = "male"
): number | null {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0 || age > 120) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === "male" ? base + 5 : base - 161;
  if (bmr <= 0 || !isFinite(bmr)) return null;
  return Math.round(bmr);
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** TDEE = BMR × activity multiplier */
export function calcTDEE(bmr: number, activityLevel: string): number | null {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel];
  if (!mult || bmr <= 0) return null;
  return Math.round(bmr * mult);
}

const GOAL_OFFSETS: Record<string, number> = {
  cut: -500,
  bulk: 300,
  maintenance: 0,
};

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Calculate macro targets based on weight, TDEE and fitness goal */
export function calcMacroTargets(
  weightKg: number,
  tdee: number,
  goal: string = "maintenance"
): MacroTargets | null {
  if (weightKg <= 0 || tdee <= 0) return null;
  const offset = GOAL_OFFSETS[goal] ?? 0;
  const calories = tdee + offset;
  const protein = Math.round(2.0 * weightKg);
  const fat = Math.round(0.8 * weightKg);
  const proteinCal = protein * 4;
  const fatCal = fat * 9;
  const carbCal = calories - proteinCal - fatCal;
  const carbs = Math.max(0, Math.round(carbCal / 4));
  return { calories, protein, carbs, fat };
}

export function useBodyMeasurements() {
  const { user } = useAuth();
  const [latest, setLatest] = useState<BodyMeasurement | null>(null);
  const [history, setHistory] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: latestRow, error: e1 } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (e1) console.error("fetchLatest error:", JSON.stringify(e1));
      setLatest(latestRow as BodyMeasurement | null);

      const { data: rows, error: e2 } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(20);

      if (e2) console.error("fetchHistory error:", JSON.stringify(e2));
      setHistory((rows as BodyMeasurement[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    // Remove any stale channel with the same name before creating a new one
    const channelName = `body_measurements_realtime_${userId}`;
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "body_measurements",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const saveMeasurement = async (
    input: MeasurementInput,
    weightKg?: number | null,
    gender: "male" | "female" = "male",
    heightCm?: number | null,
  ) => {
    if (!userId) throw new Error("Not authenticated");

    let bodyFat = input.body_fat_pct != null ? Number(input.body_fat_pct) : null;

    // Auto-calculate BF% if not provided
    if (bodyFat == null && input.waist && input.neck) {
      bodyFat = calcNavyBodyFat(
        Number(input.waist),
        Number(input.neck),
        heightCm ? Number(heightCm) : undefined,
        gender,
        input.hips ? Number(input.hips) : null,
      );
    }

    let muscleMass = input.muscle_mass_kg != null ? Number(input.muscle_mass_kg) : null;

    // Auto-calculate muscle mass if not provided but we have BF% and weight
    if (muscleMass == null && bodyFat != null && weightKg && weightKg > 0) {
      muscleMass = calcMuscleMass(weightKg, bodyFat);
    }

    const row = {
      user_id: userId,
      neck: input.neck != null ? Number(input.neck) : null,
      chest: input.chest != null ? Number(input.chest) : null,
      shoulder: input.shoulder != null ? Number(input.shoulder) : null,
      waist: input.waist != null ? Number(input.waist) : null,
      hips: input.hips != null ? Number(input.hips) : null,
      arm: input.arm != null ? Number(input.arm) : null,
      thigh: input.thigh != null ? Number(input.thigh) : null,
      body_fat_pct: bodyFat,
      muscle_mass_kg: muscleMass,
    };

    const { error } = await supabase.from("body_measurements").insert(row);
    if (error) {
      console.error("saveMeasurement error:", JSON.stringify(error));
      throw error;
    }
  };

  return { latest, history, loading, saveMeasurement, refetch: fetchData };
}
