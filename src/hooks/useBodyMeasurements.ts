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

/** Navy Seal BF% formula (male), default height 175cm */
export function calcNavyBodyFat(waist: number, neck: number, height = 175): number | null {
  if (waist <= neck || waist <= 0 || neck <= 0 || height <= 0) return null;
  const diff = waist - neck;
  if (diff <= 0) return null;
  const bf = 86.010 * Math.log10(diff) - 70.041 * Math.log10(height) + 36.76;
  if (bf <= 0 || bf > 60) return null;
  return Math.round(bf * 10) / 10;
}

/** Estimate muscle mass from weight and body fat % */
export function calcMuscleMass(weightKg: number, bodyFatPct: number): number | null {
  if (weightKg <= 0 || bodyFatPct <= 0 || bodyFatPct >= 100) return null;
  const leanMass = weightKg * (1 - bodyFatPct / 100);
  // ~roughly 45-50% of lean mass is skeletal muscle
  const muscleMass = leanMass * 0.47;
  if (muscleMass <= 0) return null;
  return Math.round(muscleMass * 10) / 10;
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
    const channel = supabase
      .channel("body_measurements_realtime")
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

  const saveMeasurement = async (input: MeasurementInput, weightKg?: number | null) => {
    if (!userId) throw new Error("Not authenticated");

    let bodyFat = input.body_fat_pct != null ? Number(input.body_fat_pct) : null;

    // Auto-calculate BF% if not provided
    if (bodyFat == null && input.waist && input.neck) {
      bodyFat = calcNavyBodyFat(Number(input.waist), Number(input.neck));
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
