import { useMemo } from "react";
import { motion } from "framer-motion";
import { type BodyMeasurement } from "@/hooks/useBodyMeasurements";
import { calculateScales } from "@/utils/biometricScaleEngine";

interface ParametricBodySVGProps {
  measurements: BodyMeasurement | null;
}

const morphSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

/* ── Palette shorthand ─────────────────────────────── */
const P = "hsl(var(--primary))";
const P80 = "hsl(var(--primary) / 0.8)";
const P40 = "hsl(var(--primary) / 0.4)";
const P25 = "hsl(var(--primary) / 0.25)";
const P15 = "hsl(var(--primary) / 0.15)";
const P10 = "hsl(var(--primary) / 0.10)";
const P06 = "hsl(var(--primary) / 0.06)";
const P04 = "hsl(var(--primary) / 0.04)";
const P03 = "hsl(var(--primary) / 0.03)";
const P02 = "hsl(var(--primary) / 0.02)";
const P20 = "hsl(var(--primary) / 0.20)";

const ParametricBodySVG = ({ measurements }: ParametricBodySVGProps) => {
  const s = useMemo(() => calculateScales(measurements), [measurements]);

  const glowRadius = useMemo(() => {
    return 1 + (s.overall - 1) * 20;
  }, [s.overall]);

  return (
    <svg viewBox="0 0 140 300" className="h-[380px] opacity-60" fill="none">
      <defs>
        {/* ── Patterns ─────────────────────────── */}
        <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke={P06} strokeWidth="1" />
        </pattern>
        <pattern id="scanlines-fine" width="2" height="2" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="2" y2="0" stroke={P04} strokeWidth="0.5" />
        </pattern>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={P04} strokeWidth="0.3" />
        </pattern>

        {/* ── Filters ──────────────────────────── */}
        <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bodyGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={glowRadius} result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="muscleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="mg" />
          <feMerge>
            <feMergeNode in="mg" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background layers ──────────────────── */}
      <rect width="140" height="300" fill="url(#grid)" />
      <line
        x1="70" y1="10" x2="70" y2="290"
        stroke={P10}
        strokeWidth="0.5"
        strokeDasharray="4 6"
        filter="url(#centerGlow)"
      />

      {/* ════════════════════════════════════════════
          HEAD — skull outline, jaw, ears, cranial line
          ════════════════════════════════════════════ */}
      <g id="head">
        {/* Skull */}
        <ellipse cx="70" cy="24" rx="15" ry="17"
          stroke={P} strokeWidth="0.8"
          fill={P03} />
        {/* Cranial midline */}
        <line x1="70" y1="8" x2="70" y2="34" stroke={P15} strokeWidth="0.3" />
        {/* Jaw definition */}
        <path d="M58 28 Q62 38 70 40 Q78 38 82 28"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Left ear */}
        <path d="M55 20 Q52 24 55 28" stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Right ear */}
        <path d="M85 20 Q88 24 85 28" stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Eye line */}
        <line x1="61" y1="21" x2="79" y2="21" stroke={P10} strokeWidth="0.3" />
      </g>

      {/* ════════════════════════════════════════════
          NECK — SCM lines, trapezius attachments
          ════════════════════════════════════════════ */}
      <motion.g
        id="neck"
        animate={{ scaleX: s.neck * s.overall }}
        transition={morphSpring}
        style={{ transformOrigin: "70px 47px" }}
      >
        {/* Neck column */}
        <rect x="63" y="40" width="14" height="12" rx="5"
          stroke={P80} strokeWidth="0.8" fill={P02} />
        {/* Left SCM */}
        <path d="M64 40 Q60 46 56 52" stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Right SCM */}
        <path d="M76 40 Q80 46 84 52" stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Trapezius attachment (left) */}
        <path d="M56 52 Q48 50 40 54" stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Trapezius attachment (right) */}
        <path d="M84 52 Q92 50 100 54" stroke={P15} strokeWidth="0.3" fill="none" />
      </motion.g>

      {/* ════════════════════════════════════════════
          TORSO — pecs, abs, serratus, lats, obliques
          ════════════════════════════════════════════ */}
      <motion.g
        id="torso"
        animate={{ scaleX: s.torso * s.overall }}
        transition={morphSpring}
        style={{ transformOrigin: "70px 100px" }}
        filter="url(#bodyGlow)"
      >
        {/* Outer contour — shoulder caps → lats → oblique taper */}
        <path
          d="M34 55 Q40 50 63 50 L77 50 Q100 50 106 55
             L108 64 Q112 90 106 115
             L100 135 Q92 145 70 148
             Q48 145 40 135 L34 115
             Q28 90 32 64 Z"
          stroke={P} strokeWidth="0.8"
          fill={P03}
        />

        {/* ── Deltoid caps ─────────────── */}
        {/* Left deltoid */}
        <path d="M34 55 Q30 58 28 68 Q30 72 34 70"
          stroke={P40} strokeWidth="0.5" fill={P03} />
        {/* Right deltoid */}
        <path d="M106 55 Q110 58 112 68 Q110 72 106 70"
          stroke={P40} strokeWidth="0.5" fill={P03} />

        {/* ── Pectorals ────────────────── */}
        {/* Left pec */}
        <path d="M42 62 Q50 58 68 62 Q68 74 55 78 Q42 76 40 68 Z"
          stroke={P25} strokeWidth="0.4" fill={P03}
          filter="url(#muscleGlow)" />
        {/* Right pec */}
        <path d="M72 62 Q90 58 98 62 Q100 68 98 76 Q85 78 72 74 Z"
          stroke={P25} strokeWidth="0.4" fill={P03}
          filter="url(#muscleGlow)" />
        {/* Pec split (sternum line) */}
        <line x1="70" y1="58" x2="70" y2="80" stroke={P25} strokeWidth="0.4" />

        {/* ── Abdominals (6-pack) ──────── */}
        {/* Linea alba (vertical center) */}
        <line x1="70" y1="82" x2="70" y2="138" stroke={P25} strokeWidth="0.4" />
        {/* Upper ab division */}
        <path d="M58 90 Q64 88 70 90 Q76 88 82 90"
          stroke={P15} strokeWidth="0.3" fill="none" filter="url(#muscleGlow)" />
        {/* Mid ab division */}
        <path d="M56 102 Q63 100 70 102 Q77 100 84 102"
          stroke={P15} strokeWidth="0.3" fill="none" filter="url(#muscleGlow)" />
        {/* Lower ab division */}
        <path d="M54 114 Q62 112 70 114 Q78 112 86 114"
          stroke={P15} strokeWidth="0.3" fill="none" filter="url(#muscleGlow)" />
        {/* Rectus abdominis outer left */}
        <path d="M56 82 Q54 100 52 120 Q50 130 52 138"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Rectus abdominis outer right */}
        <path d="M84 82 Q86 100 88 120 Q90 130 88 138"
          stroke={P15} strokeWidth="0.3" fill="none" />

        {/* ── Serratus anterior ─────────── */}
        {/* Left serratus fingers */}
        <path d="M40 72 L48 78" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M38 78 L47 84" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M36 84 L46 90" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M35 90 L45 96" stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Right serratus fingers */}
        <path d="M100 72 L92 78" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M102 78 L93 84" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M104 84 L94 90" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M105 90 L95 96" stroke={P15} strokeWidth="0.3" fill="none" />

        {/* ── Lat flare lines ──────────── */}
        <path d="M34 70 Q30 90 32 110" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M106 70 Q110 90 108 110" stroke={P15} strokeWidth="0.3" fill="none" />

        {/* Fine scanlines overlay on torso */}
        <rect x="34" y="50" width="72" height="98" fill="url(#scanlines-fine)" opacity="0.5" />
      </motion.g>

      {/* ════════════════════════════════════════════
          WAIST — oblique definition + measurement ring
          ════════════════════════════════════════════ */}
      <motion.g
        id="waist"
        animate={{ scaleX: s.waist * s.overall }}
        transition={morphSpring}
        style={{ transformOrigin: "70px 122px" }}
      >
        {/* Left oblique strokes */}
        <path d="M40 108 L48 118" stroke={P25} strokeWidth="0.4" fill="none" />
        <path d="M38 114 L46 124" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M36 120 L44 130" stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Right oblique strokes */}
        <path d="M100 108 L92 118" stroke={P25} strokeWidth="0.4" fill="none" />
        <path d="M102 114 L94 124" stroke={P15} strokeWidth="0.3" fill="none" />
        <path d="M104 120 L96 130" stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Measurement ring */}
        <ellipse cx="70" cy="122" rx="24" ry="4"
          stroke={P25} strokeWidth="0.5"
          strokeDasharray="3 2" fill="none" />
      </motion.g>

      {/* ════════════════════════════════════════════
          HIPS — iliac crest, hip flexor, inguinal lines
          ════════════════════════════════════════════ */}
      <motion.g
        id="hips"
        animate={{ scaleX: s.hips * s.overall }}
        transition={morphSpring}
        style={{ transformOrigin: "70px 148px" }}
      >
        {/* Iliac crest (left) */}
        <path d="M44 135 Q48 130 56 132 Q62 134 66 140"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Iliac crest (right) */}
        <path d="M96 135 Q92 130 84 132 Q78 134 74 140"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Inguinal crease (left) */}
        <path d="M50 140 Q58 148 64 155"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Inguinal crease (right) */}
        <path d="M90 140 Q82 148 76 155"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Hip flexor separation (left) */}
        <path d="M48 138 Q52 145 54 152"
          stroke={P10} strokeWidth="0.3" fill="none" />
        {/* Hip flexor separation (right) */}
        <path d="M92 138 Q88 145 86 152"
          stroke={P10} strokeWidth="0.3" fill="none" />
        {/* Measurement ring */}
        <ellipse cx="70" cy="148" rx="26" ry="5"
          stroke={P25} strokeWidth="0.5"
          strokeDasharray="3 2" fill="none" />
      </motion.g>

      {/* ════════════════════════════════════════════
          LEFT ARM — deltoid, bicep/tricep, forearm
          ════════════════════════════════════════════ */}
      <motion.g
        id="left-arm"
        animate={{ scaleX: s.arm }}
        transition={morphSpring}
        style={{ transformOrigin: "28px 100px" }}
      >
        {/* Outer arm contour */}
        <path
          d="M34 55 Q24 62 20 82 Q18 105 22 128 Q24 138 30 145"
          stroke={P} strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
        {/* Inner arm contour */}
        <path
          d="M38 60 Q32 68 28 82 Q26 100 28 120 Q30 132 34 140"
          stroke={P40} strokeWidth="0.5"
          fill="none" strokeLinecap="round" />
        {/* Deltoid cap */}
        <path d="M34 55 Q28 58 26 66 Q28 70 34 68"
          stroke={P25} strokeWidth="0.4" fill={P03} />
        {/* Bicep/tricep separation */}
        <path d="M30 70 Q26 85 24 100 Q24 108 26 115"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Bicep bulk line */}
        <path d="M32 72 Q28 82 27 92"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Elbow joint */}
        <circle cx="24" cy="118" r="2.5" fill={P20} stroke={P25} strokeWidth="0.3" />
        {/* Forearm brachioradialis */}
        <path d="M24 120 Q22 130 24 140"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Forearm inner line */}
        <path d="M28 120 Q26 132 28 142"
          stroke={P15} strokeWidth="0.3" fill="none" />
      </motion.g>

      {/* ════════════════════════════════════════════
          RIGHT ARM — deltoid, bicep/tricep, forearm
          ════════════════════════════════════════════ */}
      <motion.g
        id="right-arm"
        animate={{ scaleX: s.arm }}
        transition={morphSpring}
        style={{ transformOrigin: "112px 100px" }}
      >
        {/* Outer arm contour */}
        <path
          d="M106 55 Q116 62 120 82 Q122 105 118 128 Q116 138 110 145"
          stroke={P} strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
        {/* Inner arm contour */}
        <path
          d="M102 60 Q108 68 112 82 Q114 100 112 120 Q110 132 106 140"
          stroke={P40} strokeWidth="0.5"
          fill="none" strokeLinecap="round" />
        {/* Deltoid cap */}
        <path d="M106 55 Q112 58 114 66 Q112 70 106 68"
          stroke={P25} strokeWidth="0.4" fill={P03} />
        {/* Bicep/tricep separation */}
        <path d="M110 70 Q114 85 116 100 Q116 108 114 115"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Bicep bulk line */}
        <path d="M108 72 Q112 82 113 92"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Elbow joint */}
        <circle cx="116" cy="118" r="2.5" fill={P20} stroke={P25} strokeWidth="0.3" />
        {/* Forearm brachioradialis */}
        <path d="M116 120 Q118 130 116 140"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Forearm inner line */}
        <path d="M112 120 Q114 132 112 142"
          stroke={P15} strokeWidth="0.3" fill="none" />
      </motion.g>

      {/* ════════════════════════════════════════════
          LEFT LEG — quads, knee, calf, shin
          ════════════════════════════════════════════ */}
      <motion.g
        id="left-leg"
        animate={{ scaleX: s.leg }}
        transition={morphSpring}
        style={{ transformOrigin: "50px 215px" }}
      >
        {/* Outer leg contour */}
        <path
          d="M50 148 Q46 170 44 200 Q42 232 40 260 Q38 272 42 278"
          stroke={P} strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
        {/* Inner leg contour */}
        <path
          d="M64 155 Q60 175 58 200 Q56 230 54 258 Q53 270 50 276"
          stroke={P40} strokeWidth="0.5"
          fill="none" strokeLinecap="round" />
        {/* Vastus lateralis */}
        <path d="M48 155 Q44 175 42 195"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Vastus medialis */}
        <path d="M60 158 Q58 178 56 198"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Rectus femoris center */}
        <path d="M54 152 Q52 175 50 198"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Knee joint */}
        <circle cx="50" cy="206" r="3" fill={P20} stroke={P25} strokeWidth="0.3" />
        {/* Knee cap detail */}
        <ellipse cx="50" cy="206" rx="4" ry="3"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Tibialis anterior (shin) */}
        <path d="M48 212 Q46 235 44 258"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Gastrocnemius split (calf) */}
        <path d="M54 212 Q52 230 50 248"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Calf inner line */}
        <path d="M56 215 Q54 235 52 252"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Ankle joint */}
        <circle cx="44" cy="266" r="2" fill={P20} stroke={P15} strokeWidth="0.3" />
        {/* Foot */}
        <path d="M40 272 Q38 276 36 278 Q40 280 46 278"
          stroke={P40} strokeWidth="0.5" fill="none" />
      </motion.g>

      {/* ════════════════════════════════════════════
          RIGHT LEG — quads, knee, calf, shin
          ════════════════════════════════════════════ */}
      <motion.g
        id="right-leg"
        animate={{ scaleX: s.leg }}
        transition={morphSpring}
        style={{ transformOrigin: "90px 215px" }}
      >
        {/* Outer leg contour */}
        <path
          d="M90 148 Q94 170 96 200 Q98 232 100 260 Q102 272 98 278"
          stroke={P} strokeWidth="0.8"
          fill="none" strokeLinecap="round" />
        {/* Inner leg contour */}
        <path
          d="M76 155 Q80 175 82 200 Q84 230 86 258 Q87 270 90 276"
          stroke={P40} strokeWidth="0.5"
          fill="none" strokeLinecap="round" />
        {/* Vastus lateralis */}
        <path d="M92 155 Q96 175 98 195"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Vastus medialis */}
        <path d="M80 158 Q82 178 84 198"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Rectus femoris center */}
        <path d="M86 152 Q88 175 90 198"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Knee joint */}
        <circle cx="90" cy="206" r="3" fill={P20} stroke={P25} strokeWidth="0.3" />
        {/* Knee cap detail */}
        <ellipse cx="90" cy="206" rx="4" ry="3"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Tibialis anterior (shin) */}
        <path d="M92 212 Q94 235 96 258"
          stroke={P25} strokeWidth="0.4" fill="none" />
        {/* Gastrocnemius split (calf) */}
        <path d="M86 212 Q88 230 90 248"
          stroke={P25} strokeWidth="0.4" fill="none"
          filter="url(#muscleGlow)" />
        {/* Calf inner line */}
        <path d="M84 215 Q86 235 88 252"
          stroke={P15} strokeWidth="0.3" fill="none" />
        {/* Ankle joint */}
        <circle cx="96" cy="266" r="2" fill={P20} stroke={P15} strokeWidth="0.3" />
        {/* Foot */}
        <path d="M100 272 Q102 276 104 278 Q100 280 94 278"
          stroke={P40} strokeWidth="0.5" fill="none" />
      </motion.g>

      {/* ── Top scanline overlay ───────────────── */}
      <rect width="140" height="300" fill="url(#scanlines)" />
    </svg>
  );
};

export default ParametricBodySVG;
