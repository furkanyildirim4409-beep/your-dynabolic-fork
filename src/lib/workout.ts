// Unified 3-pillar calorie algorithm — Single Source of Truth
// Pillar 1: Base MET (duration × weight × 5.0)
// Pillar 2: Intensity EPOC (+15 kcal per failure/RIR-0 set)
// Pillar 3: Mechanical Work (+20 kcal per 1,000 kg lifted)

export const calculateWorkoutCalories = (
  durationMinutes: number,
  weightKg: number,
  tonnageKg: number,
  failureSets: number,
): number => {
  const baseBurn = (durationMinutes / 60) * weightKg * 5.0;
  const epocBonus = failureSets * 15;
  const mechanicalBonus = (tonnageKg / 1000) * 20;
  return Math.round(baseBurn + epocBonus + mechanicalBonus);
};

/** Count failure sets from workout details JSON */
export const countFailureSets = (details: any[] | null | undefined): number => {
  let count = 0;
  if (!Array.isArray(details)) return 0;
  for (const exercise of details) {
    if (Array.isArray(exercise.sets)) {
      for (const set of exercise.sets) {
        if (set.isFailure === true || set.is_failure === true || set.rir === 0) {
          count++;
        }
      }
    }
  }
  return count;
};
