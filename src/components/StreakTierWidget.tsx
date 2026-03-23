import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Crown, ChevronRight, Trophy, Dumbbell, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  getCurrentTier, 
  getNextTier, 
  getTierProgress,
  userTiers 
} from "@/lib/gamificationData";
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
  const { currentStreak, longestStreak, isStreakActive, simulateStreak, recordWorkout, resetStreak } = useStreakTracking();
  const [showPRModal, setShowPRModal] = useState(false);
  
  // Use streak data for XP calculation (mock)
  const currentXP = 875 + (currentStreak * 10);
  const currentTier = getCurrentTier(currentXP);
  const nextTier = getNextTier(currentXP);
  const tierProgress = getTierProgress(currentXP);

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

  const handleDemoAchievement = () => {
    hapticMedium();
    showDemoAchievement();
  };

  const handleSimulateStreak = (days: number) => {
    hapticMedium();
    simulateStreak(days);
  };

  const handleRecordWorkout = () => {
    hapticMedium();
    recordWorkout();
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
          {/* Streak */}
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

          {/* Tier */}
          <div className="flex items-center gap-1.5">
            <currentTier.icon className={`w-4 h-4 ${currentTier.color}`} />
            <span className={`font-display text-sm ${currentTier.color}`}>
              {currentTier.name}
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
            
            {/* Streak Test Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Test
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border-white/10">
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Seri Simülasyonu
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={handleRecordWorkout}
                  className="text-foreground cursor-pointer"
                >
                  <Flame className="w-4 h-4 mr-2 text-primary" />
                  +1 Gün Ekle
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSimulateStreak(7)}
                  className="text-foreground cursor-pointer"
                >
                  <Flame className="w-4 h-4 mr-2 text-orange-400" />
                  7 Gün Serisi (Rozet)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleSimulateStreak(30)}
                  className="text-foreground cursor-pointer"
                >
                  <Trophy className="w-4 h-4 mr-2 text-purple-400" />
                  30 Gün Serisi (Rozet)
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={() => resetStreak()}
                  className="text-destructive cursor-pointer"
                >
                  Seriyi Sıfırla
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {/* Tier Labels */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <currentTier.icon className={`w-5 h-5 ${currentTier.color}`} />
            <span className={`font-display text-sm ${currentTier.color}`}>
              {currentTier.name}
            </span>
          </div>
          {nextTier && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Sonraki:</span>
              <nextTier.icon className={`w-4 h-4 ${nextTier.color}`} />
              <span className={`text-xs ${nextTier.color}`}>{nextTier.name}</span>
            </div>
          )}
        </div>

        {/* Progress Bar with Tier Markers */}
        <div className="relative">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tierProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${currentTier.gradient} rounded-full relative`}
            >
              {/* Animated glow */}
              <motion.div
                className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-white/30 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Tier Markers */}
          <div className="absolute top-0 left-0 right-0 h-3 flex items-center">
            {userTiers.slice(1).map((tier, index) => {
              const position = ((tier.minXP - userTiers[0].minXP) / (userTiers[userTiers.length - 1].maxXP - userTiers[0].minXP)) * 100;
              return (
                <div
                  key={tier.name}
                  className="absolute w-0.5 h-full bg-white/20"
                  style={{ left: `${Math.min(position, 100)}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* XP Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-primary font-medium">{currentXP} XP</span>
          {nextTier && (
            <span className="text-muted-foreground">
              {nextTier.minXP - currentXP} XP kaldı
            </span>
          )}
        </div>
      </div>
      </motion.div>

      {/* PR Modal */}
      <PersonalRecords isOpen={showPRModal} onClose={() => setShowPRModal(false)} />
    </>
  );
};

export default StreakTierWidget;