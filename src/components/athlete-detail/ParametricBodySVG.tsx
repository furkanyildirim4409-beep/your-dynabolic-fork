import { type BodyMeasurement } from "@/hooks/useBodyMeasurements";

interface ParametricBodySVGProps {
  measurements: BodyMeasurement | null;
}

const ParametricBodySVG = ({ measurements }: ParametricBodySVGProps) => {
  return (
    <svg viewBox="0 0 120 280" className="h-[340px] opacity-60" fill="none">
      {/* Defs: scan-line pattern, grid, glow filter */}
      <defs>
        {/* Scan-line overlay */}
        <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke="hsl(var(--primary) / 0.06)" strokeWidth="1" />
        </pattern>

        {/* Faint grid */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--primary) / 0.04)" strokeWidth="0.3" />
        </pattern>

        {/* Glow filter for centerline */}
        <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background grid */}
      <rect width="120" height="280" fill="url(#grid)" />

      {/* Centerline glow */}
      <line
        x1="60" y1="10" x2="60" y2="270"
        stroke="hsl(var(--primary) / 0.12)"
        strokeWidth="0.5"
        strokeDasharray="4 6"
        filter="url(#centerGlow)"
      />

      {/* Head */}
      <g id="head" style={{ transformOrigin: "60px 22px" }}>
        <ellipse cx="60" cy="22" rx="14" ry="16"
          stroke="hsl(var(--primary))" strokeWidth="1"
          fill="hsl(var(--primary) / 0.05)" />
      </g>

      {/* Neck */}
      <g id="neck" style={{ transformOrigin: "60px 43px" }}>
        <rect x="54" y="38" width="12" height="10" rx="4"
          stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" />
      </g>

      {/* Torso (shoulders + chest) */}
      <g id="torso" style={{ transformOrigin: "60px 94px" }}>
        <path
          d="M30 52 Q36 48 54 48 L66 48 Q84 48 90 52 L92 60 Q94 90 88 110 L82 130 Q76 138 60 140 Q44 138 38 130 L32 110 Q26 90 28 60 Z"
          stroke="hsl(var(--primary))" strokeWidth="1"
          fill="hsl(var(--primary) / 0.04)"
        />
      </g>

      {/* Waist guide */}
      <g id="waist" style={{ transformOrigin: "60px 115px" }}>
        <ellipse cx="60" cy="115" rx="22" ry="4"
          stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5"
          strokeDasharray="3 2" fill="none" />
      </g>

      {/* Hips guide */}
      <g id="hips" style={{ transformOrigin: "60px 138px" }}>
        <ellipse cx="60" cy="138" rx="24" ry="5"
          stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5"
          strokeDasharray="3 2" fill="none" />
      </g>

      {/* Left arm */}
      <g id="left-arm" style={{ transformOrigin: "24px 93px" }}>
        <path
          d="M30 52 Q22 58 20 80 Q18 100 22 120 Q24 130 28 135"
          stroke="hsl(var(--primary))" strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
      </g>

      {/* Right arm */}
      <g id="right-arm" style={{ transformOrigin: "96px 93px" }}>
        <path
          d="M90 52 Q98 58 100 80 Q102 100 98 120 Q96 130 92 135"
          stroke="hsl(var(--primary))" strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
      </g>

      {/* Left leg */}
      <g id="left-leg" style={{ transformOrigin: "40px 200px" }}>
        <path
          d="M44 138 Q42 160 40 190 Q38 220 36 248 Q35 258 38 262"
          stroke="hsl(var(--primary))" strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
      </g>

      {/* Right leg */}
      <g id="right-leg" style={{ transformOrigin: "80px 200px" }}>
        <path
          d="M76 138 Q78 160 80 190 Q82 220 84 248 Q85 258 82 262"
          stroke="hsl(var(--primary))" strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
      </g>

      {/* Scan-line overlay */}
      <rect width="120" height="280" fill="url(#scanlines)" />
    </svg>
  );
};

export default ParametricBodySVG;
