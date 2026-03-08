import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Achievement, tierColors } from "@/lib/gamificationData";
import { hapticSuccess } from "@/lib/haptics";
import confetti from "canvas-confetti";

interface AchievementUnlockNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementUnlockNotification = ({ 
  achievement, 
  onClose 
}: AchievementUnlockNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      hapticSuccess();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 },
        colors: ["#BFFF00", "#FFD700", "#FFFFFF", "#9333EA"],
      });

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!achievement) return null;

  const tierStyle = tierColors[achievement.tier];
  const Icon = achievement.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm"
        >
          <motion.div
            className={`relative overflow-hidden rounded-2xl border-2 ${tierStyle.border} ${tierStyle.bg} backdrop-blur-xl shadow-2xl ${tierStyle.glow}`}
            animate={{ 
              boxShadow: [
                `0 0 20px rgba(191, 255, 0, 0.3)`,
                `0 0 40px rgba(191, 255, 0, 0.5)`,
                `0 0 20px rgba(191, 255, 0, 0.3)`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 via-yellow-500/10 to-purple-500/10"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            />

            <motion.div
              className="absolute top-2 right-12"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
            <motion.div
              className="absolute bottom-3 left-4"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3], rotate: [0, -180, -360] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="w-3 h-3 text-primary" />
            </motion.div>

            <div className="relative p-4">
              <button onClick={handleClose} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-foreground" />
              </button>

              <div className="flex items-center gap-1 mb-3">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: 3 }} className="text-lg">🎉</motion.span>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Rozet Açıldı!</span>
              </div>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, delay: 0.2 }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${tierStyle.bg} border-2 ${tierStyle.border}`}
                >
                  <Icon className={`w-8 h-8 ${tierStyle.text}`} />
                </motion.div>

                <div className="flex-1">
                  <motion.h3 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="font-display text-lg text-foreground">
                    {achievement.name}
                  </motion.h3>
                  <motion.p initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="text-muted-foreground text-sm">
                    {achievement.description}
                  </motion.p>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${tierStyle.text}`}>
                    {achievement.tier === 'bronze' && '🥉 Bronz'}
                    {achievement.tier === 'silver' && '🥈 Gümüş'}
                    {achievement.tier === 'gold' && '🥇 Altın'}
                    {achievement.tier === 'platinum' && '💎 Platin'}
                  </span>
                </div>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full">
                  <span className="text-primary font-bold text-sm">+{achievement.xpReward}</span>
                  <span className="text-primary text-xs">XP</span>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlockNotification;
