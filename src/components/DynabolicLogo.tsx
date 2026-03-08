import { motion } from "framer-motion";

interface DynabolicLogoProps {
  size?: number;
  animate?: boolean;
}

const DynabolicLogo = ({ size = 40, animate = true }: DynabolicLogoProps) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(68 100% 50%)" strokeWidth="2" opacity="0.3" />
      
      {/* D letter */}
      <motion.path
        d="M30 20 L30 80 L55 80 C72 80 82 65 82 50 C82 35 72 20 55 20 Z"
        fill="none"
        stroke="hsl(68 100% 50%)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      
      {/* Lightning bolt */}
      <motion.path
        d="M52 30 L42 52 L52 52 L44 70"
        fill="none"
        stroke="hsl(68 100% 50%)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
      />

      {/* Pulse glow */}
      {animate && (
        <motion.circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="hsl(68 100% 50%)"
          strokeWidth="1"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.svg>
  );
};

export default DynabolicLogo;
