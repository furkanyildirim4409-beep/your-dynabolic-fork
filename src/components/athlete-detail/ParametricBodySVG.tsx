import { useMemo } from "react";
import { motion } from "framer-motion";
import { type BodyMeasurement } from "@/hooks/useBodyMeasurements";
import { calculateScales } from "@/utils/biometricScaleEngine";

interface ParametricBodySVGProps {
  measurements: BodyMeasurement | null;
}

const ParametricBodySVG = ({ measurements }: ParametricBodySVGProps) => {
  const s = useMemo(() => calculateScales(measurements), [measurements]);

  const glowRadius = useMemo(() => {
    return 1 + (s.overall - 1) * 20;
  }, [s.overall]);

  const morphSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

  // Reusable stroke classes
  const contourClass = "stroke-primary fill-primary/5";
  const innerClass = "stroke-primary/30 fill-none";
  const detailClass = "stroke-primary/15 fill-none";

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* ViewBox expanded to 140x300 to accommodate broader shoulder and leg details */}
      <svg viewBox="0 0 140 300" className="h-[380px] w-full" fill="none">
        <defs>
          <pattern id="scan-lines" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="1" fill="currentColor" className="text-primary/10" />
          </pattern>
          <pattern id="fine-scan-lines" width="2" height="2" patternUnits="userSpaceOnUse">
            <rect width="2" height="0.5" fill="currentColor" className="text-primary/20" />
          </pattern>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-primary/5"
            />
          </pattern>
          <filter id="bodyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glowRadius} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="muscleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid & Scans */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#scan-lines)" />

        <g filter="url(#bodyGlow)">
          {/* HEAD */}
          <motion.g
            id="head"
            animate={{ scaleX: s.overall, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "70px 20px" }}
          >
            {/* Skull Outline */}
            <path
              d="M 60 10 C 60 2, 80 2, 80 10 C 80 18, 77 25, 74 32 C 72 35, 68 35, 66 32 C 63 25, 60 18, 60 10 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Ear marks & Jawline detail */}
            <path
              d="M 59 15 C 57 18, 57 22, 60 25 M 81 15 C 83 18, 83 22, 80 25 M 65 28 L 75 28"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
            {/* Cranial midline */}
            <line x1="70" y1="4" x2="70" y2="30" className={detailClass} strokeWidth="0.3" />
          </motion.g>

          {/* NECK */}
          <motion.g
            id="neck"
            animate={{ scaleX: s.neck, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "70px 40px" }}
          >
            {/* Sternocleidomastoid outline */}
            <path d="M 66 32 L 62 48 L 78 48 L 74 32 Z" className={contourClass} strokeWidth="0.8" />
            {/* Trapezius attachment */}
            <path
              d="M 50 50 L 62 40 M 90 50 L 78 40"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
            <line x1="70" y1="32" x2="70" y2="48" className={detailClass} strokeWidth="0.3" />
          </motion.g>

          {/* TORSO */}
          <motion.g
            id="torso"
            animate={{ scaleX: s.torso, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "70px 85px" }}
          >
            {/* Fine scanline mask restricted to torso */}
            <mask id="torso-mask">
              <path
                d="M 50 48 C 60 48, 80 48, 90 48 C 105 52, 110 75, 98 95 C 90 108, 85 115, 70 115 C 55 115, 50 108, 42 95 C 30 75, 35 52, 50 48 Z"
                fill="white"
              />
            </mask>
            <rect width="100%" height="100%" fill="url(#fine-scan-lines)" mask="url(#torso-mask)" opacity="0.5" />

            {/* Torso Outer Contour */}
            <path
              d="M 50 48 C 60 48, 80 48, 90 48 C 105 52, 110 75, 98 95 C 90 108, 85 115, 70 115 C 55 115, 50 108, 42 95 C 30 75, 35 52, 50 48 Z"
              className={contourClass}
              strokeWidth="0.8"
            />

            {/* Pectorals */}
            <path
              d="M 70 58 C 84 58, 94 65, 90 75 C 80 82, 73 80, 70 80 C 67 80, 60 82, 50 75 C 46 65, 56 58, 70 58 Z"
              className={innerClass}
              strokeWidth="0.5"
              filter="url(#muscleGlow)"
            />

            {/* Abs (6-pack) */}
            <path d="M 62 85 L 78 85 M 63 95 L 77 95 M 64 105 L 76 105" className={detailClass} strokeWidth="0.4" />
            {/* Linea Alba (midline) */}
            <line x1="70" y1="80" x2="70" y2="115" className={innerClass} strokeWidth="0.5" filter="url(#muscleGlow)" />

            {/* Serratus Anterior (ribs) */}
            <path d="M 46 80 L 54 85 M 44 88 L 52 93 M 43 96 L 50 101" className={detailClass} strokeWidth="0.3" />
            <path d="M 94 80 L 86 85 M 96 88 L 88 93 M 97 96 L 90 101" className={detailClass} strokeWidth="0.3" />
          </motion.g>

          {/* WAIST */}
          <motion.g
            id="waist"
            animate={{ scaleX: s.waist, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "70px 125px" }}
          >
            {/* Waist Outer Contour */}
            <path
              d="M 45 112 C 40 125, 42 135, 48 140 L 92 140 C 98 135, 100 125, 95 112 Z"
              className={contourClass}
              strokeWidth="0.8"
            />

            {/* Obliques & V-Taper */}
            <path
              d="M 45 115 C 50 125, 55 135, 60 140 M 95 115 C 90 125, 85 135, 80 140"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />

            {/* Dash indicator line representing measurement tape */}
            <path
              d="M 42 125 C 55 132, 85 132, 98 125"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              fill="none"
              opacity="0.6"
            />
          </motion.g>

          {/* HIPS */}
          <motion.g
            id="hips"
            animate={{ scaleX: s.hips, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "70px 155px" }}
          >
            {/* Hips & Pelvis Contour */}
            <path
              d="M 48 140 C 38 155, 40 165, 48 170 C 55 168, 65 162, 70 160 C 75 162, 85 168, 92 170 C 100 165, 102 155, 92 140 Z"
              className={contourClass}
              strokeWidth="0.8"
            />

            {/* Inguinal Crease (Hip Flexors) */}
            <path
              d="M 48 145 C 55 155, 65 160, 70 160 C 75 160, 85 155, 92 145"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
          </motion.g>

          {/* LEFT ARM */}
          <motion.g
            id="left-arm"
            animate={{ scaleX: s.arm, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "35px 105px" }}
          >
            {/* Deltoid */}
            <path
              d="M 42 50 C 28 55, 20 70, 28 85 C 35 78, 40 75, 45 70 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Bicep / Tricep Upper Arm */}
            <path
              d="M 28 85 C 18 100, 16 115, 22 125 C 28 132, 35 132, 40 122 C 46 105, 44 90, 40 80 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Brachialis separation line */}
            <path
              d="M 28 95 C 32 105, 34 115, 32 125"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
            {/* Forearm */}
            <path
              d="M 22 125 C 10 145, 12 165, 20 175 C 25 182, 32 182, 35 175 C 40 160, 38 140, 32 128 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Elbow Joint */}
            <circle cx="28" cy="126" r="2" className="fill-primary/20 stroke-primary/50" strokeWidth="0.5" />
          </motion.g>

          {/* RIGHT ARM */}
          <motion.g
            id="right-arm"
            animate={{ scaleX: s.arm, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "105px 105px" }}
          >
            {/* Deltoid */}
            <path
              d="M 98 50 C 112 55, 120 70, 112 85 C 105 78, 100 75, 95 70 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Bicep / Tricep Upper Arm */}
            <path
              d="M 112 85 C 122 100, 124 115, 118 125 C 112 132, 105 132, 100 122 C 94 105, 96 90, 100 80 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Brachialis separation line */}
            <path
              d="M 112 95 C 108 105, 106 115, 108 125"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
            {/* Forearm */}
            <path
              d="M 118 125 C 130 145, 128 165, 120 175 C 115 182, 108 182, 105 175 C 100 160, 102 140, 108 128 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Elbow Joint */}
            <circle cx="112" cy="126" r="2" className="fill-primary/20 stroke-primary/50" strokeWidth="0.5" />
          </motion.g>

          {/* LEFT LEG */}
          <motion.g
            id="left-leg"
            animate={{ scaleX: s.leg, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "50px 220px" }}
          >
            {/* Quadriceps (Thigh) */}
            <path
              d="M 48 170 C 32 195, 34 225, 42 245 C 52 245, 60 215, 65 160 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Vastus line (Quad separation) */}
            <path
              d="M 46 185 C 44 210, 46 230, 50 240"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
            {/* Calf */}
            <path
              d="M 42 245 C 30 265, 35 285, 40 295 C 48 285, 52 265, 48 245 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Tibialis line */}
            <path d="M 44 250 L 44 290" className={detailClass} strokeWidth="0.3" />
            {/* Knee Joint */}
            <circle cx="46" cy="245" r="2.5" className="fill-primary/20 stroke-primary/50" strokeWidth="0.5" />
          </motion.g>

          {/* RIGHT LEG */}
          <motion.g
            id="right-leg"
            animate={{ scaleX: s.leg, scaleY: s.overall }}
            transition={morphSpring}
            style={{ transformOrigin: "90px 220px" }}
          >
            {/* Quadriceps (Thigh) */}
            <path
              d="M 92 170 C 108 195, 106 225, 98 245 C 88 245, 80 215, 75 160 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Vastus line (Quad separation) */}
            <path
              d="M 94 185 C 96 210, 94 230, 90 240"
              className={innerClass}
              strokeWidth="0.4"
              filter="url(#muscleGlow)"
            />
            {/* Calf */}
            <path
              d="M 98 245 C 110 265, 105 285, 100 295 C 92 285, 88 265, 92 245 Z"
              className={contourClass}
              strokeWidth="0.8"
            />
            {/* Tibialis line */}
            <path d="M 96 250 L 96 290" className={detailClass} strokeWidth="0.3" />
            {/* Knee Joint */}
            <circle cx="94" cy="245" r="2.5" className="fill-primary/20 stroke-primary/50" strokeWidth="0.5" />
          </motion.g>
        </g>
      </svg>
    </div>
  );
};

export default ParametricBodySVG;
