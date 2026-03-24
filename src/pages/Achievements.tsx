import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronLeft, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { tierColors } from "@/lib/gamificationData";
import { useBadgeEngine, BadgeWithStatus } from "@/hooks/useBadgeEngine";
import { useXPEngine, calculateLevelInfo, LEVEL_THRESHOLDS } from "@/hooks/useXPEngine";
import { hapticSuccess, hapticLight } from "@/lib/haptics";
import { Skeleton } from "@/components/ui/skeleton";

const Achievements = () => {
  const navigate = useNavigate();
  const { badges, isLoading } = useBadgeEngine();
  const { currentXP } = useXPEngine();
  const levelInfo = calculateLevelInfo(currentXP);

  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [celebratedBadges, setCelebratedBadges] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); const timer = setTimeout(() => setIsLoaded(true), 50); return () => clearTimeout(timer); }, []);

  const filteredBadges = badges.filter(b => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  const unlockedCount = badges.filter(b => b.unlocked).length;

  const handleBadgeClick = (badge: BadgeWithStatus) => {
    hapticLight(); setSelectedBadge(badge);
    if (badge.unlocked && !celebratedBadges.has(badge.id)) {
      hapticSuccess(); setCelebratedBadges(prev => new Set([...prev, badge.id]));
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#a3e635', '#22c55e', '#facc15', '#f97316'] });
    }
  };

  const CurrentIcon = levelInfo.currentIcon;
  const NextIcon = levelInfo.nextIcon;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex items-center gap-3 relative z-50">
          <button onClick={() => { hapticLight(); navigate(-1); }} className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
          <div><h1 className="font-display text-xl text-foreground tracking-wider">BAŞARIMLAR</h1><p className="text-muted-foreground text-xs">{unlockedCount}/{badges.length} rozet açıldı</p></div>
        </div>
        <div className="px-4 pb-3">
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><CurrentIcon className={`w-5 h-5 ${levelInfo.currentColor}`} /><span className={`font-display text-sm ${levelInfo.currentColor}`}>{levelInfo.currentLevel.toUpperCase()}</span></div>
              {levelInfo.nextLevel && <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><span>{currentXP} XP</span><span>/</span><span>{currentXP + levelInfo.xpRemaining} XP</span></div>}
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${levelInfo.progressPercent}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${levelInfo.currentGradient} rounded-full`} /></div>
            {levelInfo.nextLevel && NextIcon && <div className="flex items-center justify-between mt-2"><span className="text-muted-foreground text-[10px]">{levelInfo.xpRemaining} XP kaldı</span><div className="flex items-center gap-1"><NextIcon className={`w-3 h-3 ${levelInfo.nextColor}`} /><span className={`text-[10px] ${levelInfo.nextColor}`}>{levelInfo.nextLevel}</span></div></div>}
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              {f === 'all' ? 'Tümü' : f === 'unlocked' ? 'Açık' : 'Kilitli'}
            </motion.button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="p-4 grid grid-cols-3 gap-3">
          {filteredBadges.map((badge, index) => {
            const colors = tierColors[badge.tier || "bronze"] || tierColors.bronze;
            const IconComponent = badge.icon;
            return (
              <motion.button key={badge.id} initial={false} animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }} transition={{ delay: isLoaded ? Math.min(index * 0.03, 0.3) : 0, duration: 0.2 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleBadgeClick(badge)} className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${badge.unlocked ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}` : 'bg-secondary/50 border-white/5'}`}>
                {badge.unlocked && <motion.div className="absolute inset-0 rounded-2xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}><div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" /></motion.div>}
                <div className={`relative ${badge.unlocked ? '' : 'opacity-30'}`}><IconComponent className={`w-8 h-8 ${badge.unlocked ? colors.text : 'text-muted-foreground'}`} />{!badge.unlocked && <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-muted-foreground" />}</div>
                <span className={`text-[10px] text-center leading-tight font-medium ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.name}</span>
                {!badge.unlocked && badge.progress !== undefined && <div className="absolute bottom-2 left-2 right-2 h-1 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary/50 rounded-full" style={{ width: `${badge.progress}%` }} /></div>}
                <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${badge.unlocked ? (badge.tier === 'platinum' ? 'bg-purple-400' : badge.tier === 'gold' ? 'bg-yellow-400' : badge.tier === 'silver' ? 'bg-slate-300' : 'bg-amber-600') : 'bg-muted-foreground/30'}`} />
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedBadge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedBadge(null)}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm rounded-3xl border p-6 ${selectedBadge.unlocked ? `${(tierColors[selectedBadge.tier || "bronze"] || tierColors.bronze).bg} ${(tierColors[selectedBadge.tier || "bronze"] || tierColors.bronze).border}` : 'bg-card border-white/10'}`}>
              <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              <div className="flex justify-center mb-4">
                <motion.div animate={selectedBadge.unlocked ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ duration: 1, repeat: selectedBadge.unlocked ? Infinity : 0, repeatDelay: 2 }} className={`w-24 h-24 rounded-2xl flex items-center justify-center ${selectedBadge.unlocked ? `bg-gradient-to-br ${(tierColors[selectedBadge.tier || "bronze"] || tierColors.bronze).bg} border-2 ${(tierColors[selectedBadge.tier || "bronze"] || tierColors.bronze).border}` : 'bg-secondary border border-white/10'}`}>
                  <selectedBadge.icon className={`w-12 h-12 ${selectedBadge.unlocked ? (tierColors[selectedBadge.tier || "bronze"] || tierColors.bronze).text : 'text-muted-foreground opacity-50'}`} />
                </motion.div>
              </div>
              <div className="text-center mb-4"><h3 className="font-display text-xl text-foreground mb-1">{selectedBadge.name}</h3><p className="text-muted-foreground text-sm">{selectedBadge.description}</p></div>
              {selectedBadge.condition_type && selectedBadge.condition_value && (
                <div className="glass-card p-3 mb-4"><p className="text-xs text-muted-foreground mb-1">GEREKSINIM</p><p className="text-sm text-foreground">{selectedBadge.condition_type === 'streak_days' ? `${selectedBadge.condition_value} gün üst üste seri` : selectedBadge.condition_type === 'workout_count' ? `${selectedBadge.condition_value} antrenman tamamla` : selectedBadge.condition_type === 'total_volume' ? `${selectedBadge.condition_value}kg toplam tonaj` : selectedBadge.condition_type === 'checkin_count' ? `${selectedBadge.condition_value} check-in tamamla` : `${selectedBadge.condition_value}`}</p></div>
              )}
              {selectedBadge.unlocked ? (
                <div className="flex items-center justify-center gap-2 text-primary"><Sparkles className="w-4 h-4" /><span className="text-sm">{selectedBadge.earned_at && new Date(selectedBadge.earned_at).toLocaleDateString('tr-TR')} tarihinde açıldı</span></div>
              ) : null}
              <div className="mt-4 text-center"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${selectedBadge.unlocked ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>+{selectedBadge.xpReward} XP</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Achievements;
