import { motion } from "framer-motion";
import { Coins } from "lucide-react";

interface BioCoinWalletProps {
  balance: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const BioCoinWallet = ({ balance, size = "md", showLabel = false }: BioCoinWalletProps) => {
  const sizeClasses = {
    sm: "px-2 py-1 gap-1",
    md: "px-3 py-1.5 gap-2",
    lg: "px-4 py-2 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <motion.div
      className={`flex items-center ${sizeClasses[size]} bg-primary/20 rounded-full border border-primary/30`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Coins className={`${iconSizes[size]} text-primary`} />
      </motion.div>
      <div className="flex items-center gap-1">
        <span className={`font-display ${textSizes[size]} text-primary`}>
          {balance.toLocaleString()}
        </span>
        {showLabel && (
          <span className={`text-muted-foreground ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
            BIO
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default BioCoinWallet;
