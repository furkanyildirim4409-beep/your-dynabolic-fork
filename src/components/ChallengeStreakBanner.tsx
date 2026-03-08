import { motion } from "framer-motion";
import { Flame, Trophy, Target, Coins, TrendingUp, ChevronDown } from "lucide-react";
import { useChallengeStreaks } from "@/hooks/useChallengeStreaks";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hapticLight } from "@/lib/haptics";

interface ChallengeStreakBannerProps {
  showDevTools?: boolean;
}

const ChallengeStreakBanner = ({ showDevTools = false }: ChallengeStreakBannerProps) => {
  const {
    streakData,
    currentMilestone,
    nextMilestone,
    getWinRate,
    resetStreak,
    simulateWins,
  } = useChallengeStreaks();

  const winRate = getWinRate();
  const progressToNext = nextMilestone
    ? ((streakData.currentWinStreak) / nextMilestone.streak) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 mb-4 relative overflow-hidden"
    >
      {/* Background glow for active streak */}
      {streakData.currentWinStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500"
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
          }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              streakData.currentWinStreak >= 3 
                ? "bg-gradient-to-br from-orange-500 to-red-500" 
                : "bg-primary/20"
            }`}>
              {currentMilestone ? (
                <span className="text-lg">{currentMilestone.emoji}</span>
              ) : (
                <Flame className={`w-5 h-5 ${
                  streakData.currentWinStreak >= 3 ? "text-white" : "text-primary"
                }`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-foreground">
                  {currentMilestone ? currentMilestone.name : "Meydan Okuma Serisi"}
                </h3>
                {showDevTools && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded bg-white/5 hover:bg-white/10">
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-background border-white/10">
                      <DropdownMenuItem onClick={() => { hapticLight(); simulateWins(1); }}>
                        +1 Kazanç Simüle Et
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { hapticLight(); simulateWins(3); }}>
                        +3 Kazanç (Üçleme)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { hapticLight(); simulateWins(5); }}>
                        +5 Kazanç (Beşli Seri)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => { hapticLight(); resetStreak(); }}
                        className="text-red-400"
                      >
                        Seriyi Sıfırla
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {currentMilestone 
                  ? `${currentMilestone.bonusMultiplier}x bonus çarpanı aktif!`
                  : "Meydan okumaları kazanarak seri oluştur"
                }
              </p>
            </div>
          </div>

          {/* Current Streak */}
          <div className="text-right">
            <motion.p 
              key={streakData.currentWinStreak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-display text-3xl ${
                streakData.currentWinStreak >= 5 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400"
                  : streakData.currentWinStreak >= 3 
                  ? "text-orange-400"
                  : "text-primary"
              }`}
            >
              {streakData.currentWinStreak}
            </motion.p>
            <p className="text-muted-foreground text-[10px]">ART ARDA KAZANÇ</p>
          </div>
        </div>

        {/* Progress to next milestone */}
        {nextMilestone && streakData.currentWinStreak > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Sonraki: {nextMilestone.emoji} {nextMilestone.name}
              </span>
              <span className="text-primary">
                {streakData.currentWinStreak}/{nextMilestone.streak}
              </span>
            </div>
            <Progress 
              value={progressToNext} 
              className="h-1.5 bg-secondary"
            />
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="font-display text-emerald-400 text-sm">{streakData.totalWins}</p>
            <p className="text-muted-foreground text-[9px]">KAZANÇ</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <Target className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="font-display text-primary text-sm">{winRate}%</p>
            <p className="text-muted-foreground text-[9px]">ORAN</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <TrendingUp className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="font-display text-orange-400 text-sm">{streakData.longestWinStreak}</p>
            <p className="text-muted-foreground text-[9px]">EN UZUN</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="font-display text-yellow-400 text-sm">{streakData.bonusCoinsEarned}</p>
            <p className="text-muted-foreground text-[9px]">BONUS</p>
          </div>
        </div>

        {/* Bonus Preview */}
        {currentMilestone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-yellow-400 text-xs flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Aktif Bonus Çarpanı
              </span>
              <span className="font-display text-yellow-400">
                {currentMilestone.bonusMultiplier}x
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default ChallengeStreakBanner;