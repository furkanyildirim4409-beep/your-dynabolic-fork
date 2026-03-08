import { motion } from "framer-motion";

interface PerformanceRingProps {
  score: number;
  label?: string;
  sublabel?: string;
}

const PerformanceRing = ({ score, label = "Hazır Oluşluk", sublabel = "Bugün için optimal" }: PerformanceRingProps) => {
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Main Ring Container */}
      <div className="relative w-64 h-64">
        {/* Background Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 256 256"
        >
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
            opacity="0.3"
          />
        </svg>

        {/* Animated Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 256 256"
        >
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(68, 100%, 50%)" />
              <stop offset="50%" stopColor="hsl(68, 100%, 60%)" />
              <stop offset="100%" stopColor="hsl(68, 100%, 45%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Glow layer */}
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="hsl(68, 100%, 50%)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            filter="url(#glow)"
            opacity="0.5"
          />
          
          {/* Main progress ring */}
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="font-display text-7xl font-extrabold text-foreground tracking-tight"
          >
            {score}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1 }}
            className="text-primary font-medium text-sm uppercase tracking-widest mt-1"
          >
            {label}
          </motion.span>
        </div>
      </div>

      {/* Sublabel */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-muted-foreground text-sm mt-4"
      >
        {sublabel}
      </motion.p>
    </div>
  );
};

export default PerformanceRing;