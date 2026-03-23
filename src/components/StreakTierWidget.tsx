import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, ChevronRight, Trophy, Dumbbell, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useXPEngine } from "@/hooks/useXPEngine";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import PersonalRecords from "@/components/PersonalRecords";
import { useAchievements } from "@/hooks/useAchievements";
import { useStreakTracking } from "@/hooks/useStreakTracking";

interface StreakTierWidgetProps {
  compact?: boolean;
}

const StreakTierWidget = ({ compact = false }: StreakTierWidgetProps) => {
  const navigate = useNavigate();
  const { showDemoAchievement } = useAchievements();
  const { currentStreak, longestStreak, isStreakActive } = useStreakTracking();
  const { levelInfo, currentXP } = useXPEngine();
  const [showPRModal, setShowPRModal] = useState(false);

  const CurrentIcon = levelInfo.currentIcon;
  const NextIcon = levelInfo.nextIcon;

  const handleNavigateToAchievements = () => {
    hapticLight();
    navigate('/achievements');
  };

  const handleNavigateToLeaderboard = () => {
    hapticLight();
    navigate('/leaderboard');
  };

  const handleOpenPRModal = () => {
    hapticMedium();
    setShowPRModal(true);
  };

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleNavigateToAchievements}
        className="glass-card p-3 flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={isStreakActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Flame className={`w-5 h-5 ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </motion.div>
            <span className={`font-display text-lg ${isStreakActive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {currentStreak}
            </span>
            <span className="text-muted-foreground text-xs">gün</span>
          </div>

          <div className="w-px h-6 bg-white/10" />

          <div className="flex items-center gap-1.5">
            <CurrentIcon className={`w-4 h-4 ${levelInfo.currentColor}`} />
            <span className={`font-display text-sm ${levelInfo.currentColor}`}>
              {levelInfo.currentLevel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{currentXP} XP</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.button>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="font-display text-sm text-foreground tracking-wider">
              SEVİYE & SERİ
            </h3>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenPRModal}
              className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium flex items-center gap-1"
            >
              <Dumbbell className="w-3 h-3" />
              PR
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNavigateToLeaderboard}
              className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              Lig
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNavigateToAchievements}
              className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium"
            >
              Rozetler
            </motion.button>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isStreakActive ? { 
                scale: [1, 1.15, 1],
                filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)']
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isStreakActive 
                  ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-500/50' 
                  : 'bg-secondary border border-white/10'
              }`}
            >
              <Flame className={`w-7 h-7 ${isStreakActive ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </motion.div>
            <div>
              <p className={`font-display text-3xl ${isStreakActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {currentStreak}
              </p>
              <p className="text-muted-foreground text-xs">gün seri</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-muted-foreground text-[10px]">EN UZUN</p>
            <p className="font-display text-lg text-foreground">
              {longestStreak} gün
            </p>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrentIcon className={`w-5 h-5 ${levelInfo.currentColor}`} />
              <span className={`font-display text-sm ${levelInfo.currentColor}`}>
                {levelInfo.currentLevel}
              </span>
            </div>
            {levelInfo.nextLevel && NextIcon && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Sonraki:</span>
                <NextIcon className={`w-4 h-4 ${levelInfo.nextColor}`} />
                <span className={`text-xs ${levelInfo.nextColor}`}>{levelInfo.nextLevel}</span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${levelInfo.currentGradient} rounded-full relative`}
              >
                <motion.div
                  className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/30 rounded-full"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-primary font-medium">{currentXP} XP</span>
            {levelInfo.nextLevel && (
              <span className="text-muted-foreground">
                {levelInfo.xpRemaining} XP kaldı
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <PersonalRecords isOpen={showPRModal} onClose={() => setShowPRModal(false)} />
    </>
  );
};

export default StreakTierWidget;
