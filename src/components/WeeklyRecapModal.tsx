import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Calendar, Trophy, Flame, Dumbbell, TrendingUp, 
  TrendingDown, Minus, Coins, Target, Award, Swords,
  ChevronRight, Share2, ArrowRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeeklyRecapData } from "@/hooks/useWeeklyRecap";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import { shareRecapImage } from "@/lib/recapImageGenerator";

interface WeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WeeklyRecapData | null;
}

const WeeklyRecapModal = ({ isOpen, onClose, data }: WeeklyRecapModalProps) => {
  if (!isOpen || !data) return null;

  const formatDateRange = () => {
    const start = new Date(data.weekStartDate);
    const end = new Date(data.weekEndDate);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${start.toLocaleDateString("tr-TR", options)} - ${end.toLocaleDateString("tr-TR", options)}`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-emerald-400";
    if (value < 0) return "text-red-400";
    return "text-muted-foreground";
  };

  const handleShare = () => {
    hapticLight();
    toast({
      title: "Paylaşım hazırlanıyor...",
      description: "Haftalık özet görseli oluşturuluyor",
    });
  };

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  // Calculate performance score (0-100)
  const performanceScore = Math.min(100, Math.round(
    (data.workoutsCompleted * 12) +
    (data.streakDays * 8) +
    (data.challengesWon * 15) +
    (data.personalRecords * 10)
  ));

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: "Mükemmel! 🔥", color: "text-emerald-400" };
    if (score >= 60) return { label: "Harika! 💪", color: "text-primary" };
    if (score >= 40) return { label: "İyi Gidiyor! 👍", color: "text-yellow-400" };
    return { label: "Devam Et! 🎯", color: "text-orange-400" };
  };

  const scoreInfo = getScoreLabel(performanceScore);

  // Comparison bar helper
  const ComparisonRow = ({ 
    label, 
    icon: Icon, 
    iconColor, 
    current, 
    previous, 
    pctChange, 
    suffix = "" 
  }: { 
    label: string; 
    icon: any; 
    iconColor: string; 
    current: string; 
    previous: string; 
    pctChange: number; 
    suffix?: string;
  }) => {
    const maxVal = Math.max(Number(current) || 1, Number(previous) || 1);
    const curWidth = maxVal > 0 ? Math.max(8, (parseFloat(current) / maxVal) * 100) : 8;
    const prevWidth = maxVal > 0 ? Math.max(8, (parseFloat(previous) / maxVal) * 100) : 8;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(pctChange)}
            <span className={`text-xs font-medium ${getTrendColor(pctChange)}`}>
              {pctChange > 0 ? "+" : ""}{pctChange}%
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          {/* Current week */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-12 text-right">Bu hafta</span>
            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${curWidth}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
              />
            </div>
            <span className="text-xs font-medium text-foreground w-12">{current}{suffix}</span>
          </div>
          {/* Previous week */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-12 text-right">Önceki</span>
            <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${prevWidth}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="h-full rounded-full bg-white/15"
              />
            </div>
            <span className="text-xs text-muted-foreground w-12">{previous}{suffix}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-md"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-4 z-[9999] bg-gradient-to-b from-background via-background to-background/95 rounded-3xl border border-white/10 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button 
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mb-2">
              <Calendar className="w-4 h-4" />
              {formatDateRange()}
            </div>
            <h2 className="font-display text-2xl text-foreground tracking-wide">
              HAFTALIK ÖZET
            </h2>
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Performance Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-6"
          >
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-secondary"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(performanceScore / 100) * 352} 352`}
                  initial={{ strokeDasharray: "0 352" }}
                  animate={{ strokeDasharray: `${(performanceScore / 100) * 352} 352` }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="font-display text-4xl text-foreground"
                >
                  {performanceScore}
                </motion.span>
                <span className="text-muted-foreground text-xs">PUAN</span>
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`font-display text-lg mt-3 ${scoreInfo.color}`}
            >
              {scoreInfo.label}
            </motion.p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* Workouts */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(data.comparedToLastWeek.workouts)}
                  <span className={`text-[10px] ${getTrendColor(data.comparedToLastWeek.workouts)}`}>
                    {data.comparedToLastWeek.workouts > 0 ? "+" : ""}{data.comparedToLastWeek.workouts}%
                  </span>
                </div>
              </div>
              <p className="font-display text-2xl text-foreground">{data.workoutsCompleted}</p>
              <p className="text-muted-foreground text-xs">Antrenman</p>
            </div>

            {/* Streak */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(data.comparedToLastWeek.streak)}
                  <span className={`text-[10px] ${getTrendColor(data.comparedToLastWeek.streak)}`}>
                    {data.comparedToLastWeek.streak > 0 ? "+" : ""}{data.comparedToLastWeek.streak} gün
                  </span>
                </div>
              </div>
              <p className="font-display text-2xl text-foreground">{data.streakDays}</p>
              <p className="text-muted-foreground text-xs">Gün Seri</p>
            </div>

            {/* Challenges */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Swords className="w-5 h-5 text-purple-400" />
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="font-display text-2xl text-foreground">
                {data.challengesWon}
                <span className="text-muted-foreground text-sm">/{data.challengesWon + data.challengesLost}</span>
              </p>
              <p className="text-muted-foreground text-xs">Kazanılan</p>
            </div>

            {/* Tonnage */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <div className="flex items-center gap-1">
                  {getTrendIcon(data.comparedToLastWeek.tonnage)}
                  <span className={`text-[10px] ${getTrendColor(data.comparedToLastWeek.tonnage)}`}>
                    {data.comparedToLastWeek.tonnage > 0 ? "+" : ""}{data.comparedToLastWeek.tonnage}%
                  </span>
                </div>
              </div>
              <p className="font-display text-2xl text-foreground">
                {(data.totalTonnage / 1000).toFixed(1)}
                <span className="text-sm text-muted-foreground">t</span>
              </p>
              <p className="text-muted-foreground text-xs">Toplam Tonaj</p>
            </div>
          </motion.div>

          {/* Week-over-Week Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm text-muted-foreground tracking-wide">
                HAFTALIK KARŞILAŞTIRMA
              </h3>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="glass-card p-4 space-y-5">
              <ComparisonRow
                label="Antrenman"
                icon={Dumbbell}
                iconColor="text-primary"
                current={String(data.workoutsCompleted)}
                previous={String(data.previousWeek.workouts)}
                pctChange={data.comparedToLastWeek.workouts}
              />
              <ComparisonRow
                label="Tonaj"
                icon={Target}
                iconColor="text-emerald-400"
                current={(data.totalTonnage / 1000).toFixed(1)}
                previous={(data.previousWeek.tonnage / 1000).toFixed(1)}
                pctChange={data.comparedToLastWeek.tonnage}
                suffix="t"
              />
              <ComparisonRow
                label="Kazanılan"
                icon={Trophy}
                iconColor="text-yellow-400"
                current={String(data.challengesWon)}
                previous={String(data.previousWeek.challengesWon)}
                pctChange={data.comparedToLastWeek.challenges}
              />
              <ComparisonRow
                label="Bio-Coin"
                icon={Coins}
                iconColor="text-yellow-400"
                current={String(data.bioCoinsEarned + data.bonusCoinsEarned)}
                previous={String(data.previousWeek.coins)}
                pctChange={data.comparedToLastWeek.coins}
              />
            </div>
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <h3 className="font-display text-sm text-muted-foreground tracking-wide">
              HAFTANIN ÖNE ÇIKANLARI
            </h3>

            {/* Top Exercise */}
            <div className="glass-card p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">En Çok Yapılan</p>
                <p className="text-muted-foreground text-xs">{data.topExercise}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Personal Records */}
            {data.personalRecords > 0 && (
              <div className="glass-card p-3 flex items-center gap-3 border-l-2 border-l-yellow-500">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {data.personalRecords} Kişisel Rekor! 🎉
                  </p>
                  <p className="text-muted-foreground text-xs">Bu hafta sınırlarını aştın</p>
                </div>
              </div>
            )}

            {/* Coins Earned */}
            <div className="glass-card p-3 flex items-center gap-3 bg-yellow-500/5 border-yellow-500/20">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-sm font-medium">
                  +{data.bioCoinsEarned + data.bonusCoinsEarned} Bio-Coin
                </p>
                {data.bonusCoinsEarned > 0 && (
                  <p className="text-emerald-400 text-xs">
                    +{data.bonusCoinsEarned} bonus dahil!
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Paylaş
          </Button>
          <Button
            onClick={() => { hapticSuccess(); handleClose(); }}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Devam Et
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeeklyRecapModal;