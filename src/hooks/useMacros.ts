import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBodyMeasurements, calcBMR, calcTDEE, calcMacroTargets, type MacroTargets } from "@/hooks/useBodyMeasurements";

export interface ResolvedMacros extends MacroTargets {
  source: "coach" | "profile" | "auto" | "default";
}

const DEFAULT_MACROS: ResolvedMacros = {
  calories: 2200,
  protein: 180,
  carbs: 250,
  fat: 70,
  source: "default",
};

/**
 * Centralized macro target resolution with priority:
 * 1. Coach-set targets (coach_id present + targets filled) → source: "coach"
 * 2. User-set targets (no coach_id + targets filled)      → source: "profile"
 * 3. Auto-calculated from TDEE + goal                     → source: "auto"
 * 4. Hardcoded defaults                                   → source: "default"
 */
export function useMacros(): ResolvedMacros {
  const { profile } = useAuth();
  const { latest } = useBodyMeasurements();

  return useMemo(() => {
    if (!profile) return DEFAULT_MACROS;

    const p = profile as Record<string, unknown>;
    const hasDbTargets =
      p.daily_protein_target != null &&
      p.daily_carb_target != null &&
      p.daily_fat_target != null;

    // Priority 1 & 2: DB targets exist (coach-set or user-set)
    if (hasDbTargets) {
      const protein = Number(p.daily_protein_target);
      const carbs = Number(p.daily_carb_target);
      const fat = Number(p.daily_fat_target);
      const calories = p.daily_calorie_target
        ? Number(p.daily_calorie_target)
        : protein * 4 + carbs * 4 + fat * 9;
      const source = p.coach_id ? "coach" : "profile";
      return { calories, protein, carbs, fat, source } as ResolvedMacros;
    }

    // Priority 3: Auto-calculate from TDEE + goal
    const weightKg = p.current_weight ? Number(p.current_weight) : null;
    const heightCm = p.height_cm ? Number(p.height_cm) : null;
    const gender = (p.gender as "male" | "female") ?? "male";
    const birthDate = p.birth_date ? String(p.birth_date) : null;
    const activityLevel = (p.activity_level as string) ?? "moderate";
    const fitnessGoal = (p.fitness_goal as string) ?? "maintenance";

    if (weightKg && heightCm && birthDate) {
      const age = Math.floor(
        (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      const bmr = calcBMR(weightKg, heightCm, age, gender);
      if (bmr) {
        const tdee = calcTDEE(bmr, activityLevel);
        if (tdee) {
          const macros = calcMacroTargets(weightKg, tdee, fitnessGoal);
          if (macros) {
            return { ...macros, source: "auto" as const };
          }
        }
      }
    }

    // Priority 4: Defaults
    return DEFAULT_MACROS;
  }, [profile, latest]);
}
