import { type BodyMeasurement } from "@/hooks/useBodyMeasurements";

export interface BodyScales {
  neck: number;
  torso: number;
  waist: number;
  hips: number;
  arm: number;
  leg: number;
  overall: number;
}

const BASELINES = {
  neck: 38,
  chest: 100,
  shoulder: 115,
  waist: 80,
  hips: 95,
  arm: 35,
  thigh: 55,
  body_fat_pct: 15,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function scaleFor(value: number | null | undefined, baseline: number): number {
  if (!value || value <= 0) return 1;
  return clamp(value / baseline, 0.8, 1.4);
}

export function calculateScales(measurements: BodyMeasurement | null): BodyScales {
  const defaults: BodyScales = { neck: 1, torso: 1, waist: 1, hips: 1, arm: 1, leg: 1, overall: 1 };
  if (!measurements) return defaults;

  const chest = scaleFor(measurements.chest, BASELINES.chest);
  const shoulder = scaleFor(measurements.shoulder, BASELINES.shoulder);
  const torso = measurements.chest || measurements.shoulder
    ? clamp((chest + shoulder) / 2, 0.8, 1.4)
    : 1;

  const bf = measurements.body_fat_pct;
  const overall = bf && bf > 0
    ? clamp(1 + (bf - BASELINES.body_fat_pct) * 0.005, 0.95, 1.1)
    : 1;

  return {
    neck: scaleFor(measurements.neck, BASELINES.neck),
    torso,
    waist: scaleFor(measurements.waist, BASELINES.waist),
    hips: scaleFor(measurements.hips, BASELINES.hips),
    arm: scaleFor(measurements.arm, BASELINES.arm),
    leg: scaleFor(measurements.thigh, BASELINES.thigh),
    overall,
  };
}
