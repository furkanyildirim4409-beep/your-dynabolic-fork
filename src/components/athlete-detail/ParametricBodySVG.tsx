import { useMemo } from "react";
import { motion } from "framer-motion";
import { type BodyMeasurement } from "@/hooks/useBodyMeasurements";
import { calculateScales } from "@/utils/biometricScaleEngine";

interface ParametricBodySVGProps {
  measurements: BodyMeasurement | null;
}

const morphSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

const P = "hsl(var(--primary))";
const P40 = "hsl(var(--primary) / 0.4)";
const P04 = "hsl(var(--primary) / 0.04)";
const P06 = "hsl(var(--primary) / 0.06)";
const P10 = "hsl(var(--primary) / 0.10)";

/* ── Single smooth body silhouette path ─────────────── */
const BODY_PATH = `
  M 70 8
  C 60 8, 55 14, 55 24
  C 55 32, 60 38, 64 40
  L 63 48
  C 46 48, 34 52, 30 58
  C 24 56, 18 64, 16 78
  C 14 92, 16 110, 20 124
  C 22 132, 26 138, 30 142
  L 34 146
  C 36 144, 38 140, 36 132
  C 34 120, 32 108, 34 96
  C 36 84, 38 72, 36 64
  L 40 56
  C 42 54, 46 52, 50 51
  L 48 148
  C 46 156, 44 168, 44 180
  C 42 200, 40 218, 38 236
  C 36 252, 34 264, 34 272
  C 34 278, 38 282, 44 282
  C 50 282, 52 278, 52 274
  C 54 262, 54 250, 56 236
  C 58 218, 60 200, 62 180
  L 66 155
  L 70 152
  L 74 155
  L 78 180
  C 80 200, 82 218, 84 236
  C 86 250, 86 262, 88 274
  C 88 278, 90 282, 96 282
  C 102 282, 106 278, 106 272
  C 106 264, 104 252, 102 236
  C 100 218, 98 200, 96 180
  C 96 168, 94 156, 92 148
  L 90 51
  C 94 52, 98 54, 100 56
  L 104 64
  C 102 72, 104 84, 106 96
  C 108 108, 106 120, 104 132
  C 102 140, 104 144, 106 146
  L 110 142
  C 114 138, 118 132, 120 124
  C 124 110, 126 92, 124 78
  C 122 64, 116 56, 110 58
  C 106 52, 94 48, 77 48
  L 76 40
  C 80 38, 85 32, 85 24
  C 85 14, 80 8, 70 8
  Z
`;

const ParametricBodySVG = ({ measurements }: ParametricBodySVGProps) => {
  const s = useMemo(() => calculateScales(measurements), [measurements]);

  const orbs = useMemo(() => [
    { cx: 70, cy: 75, rx: 28, ry: 20, scale: s.torso, label: "chest" },
    { cx: 70, cy: 122, rx: 22, ry: 14, scale: s.waist, label: "waist" },
    { cx: 70, cy: 150, rx: 24, ry: 16, scale: s.hips, label: "hips" },
    { cx: 30, cy: 92, rx: 14, ry: 22, scale: s.arm, label: "l-arm" },
    { cx: 110, cy: 92, rx: 14, ry: 22, scale: s.arm, label: "r-arm" },
    { cx: 52, cy: 220, rx: 14, ry: 30, scale: s.leg, label: "l-leg" },
    { cx: 88, cy: 220, rx: 14, ry: 30, scale: s.leg, label: "r-leg" },
  ], [s]);

  return (
    <svg viewBox="0 0 140 300" className="h-[380px] opacity-60" fill="none">
      <defs>
        {/* Grid pattern */}
        <pattern id="pb-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={P04} strokeWidth="0.3" />
        </pattern>
        {/* Scanlines */}
        <pattern id="pb-scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke={P06} strokeWidth="1" />
        </pattern>

        {/* Heatmap blur */}
        <filter id="heatmap-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
        </filter>

        {/* Scan line glow */}
        <filter id="scan-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>

        {/* Body clip path */}
        <clipPath id="body-clip">
          <path d={BODY_PATH} />
        </clipPath>

        {/* Animated scan line style */}
        <style>{`
          @keyframes scanSweep {
            0% { transform: translateY(8px); }
            50% { transform: translateY(280px); }
            100% { transform: translateY(8px); }
          }
          .scan-line { animation: scanSweep 4s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* ── Background ──────────────────────── */}
      <rect width="140" height="300" fill="url(#pb-grid)" />
      <line
        x1="70" y1="10" x2="70" y2="290"
        stroke={P10} strokeWidth="0.5" strokeDasharray="4 6"
      />

      {/* ── Silhouette outline (stroke only) ── */}
      <path
        d={BODY_PATH}
        stroke={P40}
        strokeWidth="0.8"
        fill="none"
        strokeLinejoin="round"
      />

      {/* ── Heatmap orbs (clipped to body) ──── */}
      <g clipPath="url(#body-clip)">
        {orbs.map((orb) => (
          <motion.ellipse
            key={orb.label}
            cx={orb.cx}
            cy={orb.cy}
            rx={orb.rx}
            ry={orb.ry}
            fill={P}
            filter="url(#heatmap-blur)"
            animate={{
              scaleX: orb.scale,
              scaleY: orb.scale,
              opacity: 0.15 + (orb.scale - 0.8) * 0.6,
            }}
            transition={morphSpring}
            style={{ transformOrigin: `${orb.cx}px ${orb.cy}px` }}
          />
        ))}

        {/* ── Animated scan line ──────────── */}
        <line
          className="scan-line"
          x1="10" y1="0" x2="130" y2="0"
          stroke={P40}
          strokeWidth="1.5"
          filter="url(#scan-glow)"
        />
      </g>

      {/* ── Top scanline overlay ────────────── */}
      <rect width="140" height="300" fill="url(#pb-scanlines)" />
    </svg>
  );
};

export default ParametricBodySVG;
