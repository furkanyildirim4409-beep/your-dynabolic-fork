import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ChevronLeft, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { achievements, Achievement, tierColors, userGamificationStats, getCurrentTier, getNextTier, getTierProgress } from "@/lib/gamificationData";
import { hapticSuccess, hapticLight } from "@/lib/haptics";

const Achievements = () => {
  const navigate = useNavigate();
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [celebratedBadges, setCelebratedBadges] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); const timer = setTimeout(() => setIsLoaded(true), 50); return () => clearTimeout(timer); }, []);

  const filteredAchievements = achievements.filter(a => { if (filter === 'unlocked') return a.unlocked; if (filter === 'locked') return !a.unlocked; return true; });

  const handleBadgeClick = (badge: Achievement) => {
    hapticLight(); setSelectedBadge(badge);
    if (badge.unlocked && !celebratedBadges.has(badge.id)) {
      hapticSuccess(); setCelebratedBadges(prev => new Set([...prev, badge.id]));
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#a3e635', '#22c55e', '#facc15', '#f97316'] });
    }
  };

  const currentTier = getCurrentTier(userGamificationStats.currentXP);
  const nextTier = getNextTier(userGamificationStats.currentXP);
  const tierProgress = getTierProgress(userGamificationStats.currentXP);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-3 flex items-center gap-3 relative z-50">
          <button onClick={() => { hapticLight(); navigate(-1); }} className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
          <div><h1 className="font-display text-xl text-foreground tracking-wider">BAŞARIMLAR</h1><p className="text-muted-foreground text-xs">{userGamificationStats.unlockedBadges}/{userGamificationStats.totalBadges} rozet açıldı</p></div>
        </div>
        <div className="px-4 pb-3">
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><currentTier.icon className={`w-5 h-5 ${currentTier.color}`} /><span className={`font-display text-sm ${currentTier.color}`}>{currentTier.name.toUpperCase()}</span></div>
              {nextTier && <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><span>{userGamificationStats.currentXP} XP</span><span>/</span><span>{nextTier.minXP} XP</span></div>}
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${tierProgress}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full bg-gradient-to-r ${currentTier.gradient} rounded-full`} /></div>
            {nextTier && <div className="flex items-center justify-between mt-2"><span className="text-muted-foreground text-[10px]">{nextTier.minXP - userGamificationStats.currentXP} XP kaldı</span><div className="flex items-center gap-1"><nextTier.icon className={`w-3 h-3 ${nextTier.color}`} /><span className={`text-[10px] ${nextTier.color}`}>{nextTier.name}</span></div></div>}
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
      <div className="p-4 grid grid-cols-3 gap-3">
        {filteredAchievements.map((badge, index) => {
          const colors = tierColors[badge.tier];
          const IconComponent = badge.icon;
          return (
            <motion.button key={badge.id} initial={false} animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }} transition={{ delay: isLoaded ? Math.min(index * 0.03, 0.3) : 0, duration: 0.2 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleBadgeClick(badge)} className={`relative aspect-square rounded-2xl border p-3 flex flex-col items-center justify-center gap-2 transition-all ${badge.unlocked ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}` : 'bg-secondary/50 border-white/5'}`}>
              {badge.unlocked && <motion.div className="absolute inset-0 rounded-2xl overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}><div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" /></motion.div>}
              <div className={`relative ${badge.unlocked ? '' : 'opacity-30'}`}><IconComponent className={`w-8 h-8 ${badge.unlocked ? colors.text : 'text-muted-foreground'}`} />{!badge.unlocked && <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-muted-foreground" />}</div>
              <span className={`text-[10px] text-center leading-tight font-medium ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.name}</span>
              {!badge.unlocked && badge.progress !== undefined && <div className="absolute bottom-2 left-2 right-2 h-1 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary/50 rounded-full" style={{ width: `${badge.progress}%` }} /></div>}
              <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${badge.unlocked ? badge.tier === 'platinum' ? 'bg-purple-400' : badge.tier === 'gold' ? 'bg-yellow-400' : badge.tier === 'silver' ? 'bg-slate-300' : 'bg-amber-600' : 'bg-muted-foreground/30'}`} />
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {selectedBadge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedBadge(null)}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm rounded-3xl border p-6 ${selectedBadge.unlocked ? `${tierColors[selectedBadge.tier].bg} ${tierColors[selectedBadge.tier].border}` : 'bg-card border-white/10'}`}>
              <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              <div className="flex justify-center mb-4"><motion.div animate={selectedBadge.unlocked ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ duration: 1, repeat: selectedBadge.unlocked ? Infinity : 0, repeatDelay: 2 }} className={`w-24 h-24 rounded-2xl flex items-center justify-center ${selectedBadge.unlocked ? `bg-gradient-to-br ${tierColors[selectedBadge.tier].bg} border-2 ${tierColors[selectedBadge.tier].border}` : 'bg-secondary border border-white/10'}`}><selectedBadge.icon className={`w-12 h-12 ${selectedBadge.unlocked ? tierColors[selectedBadge.tier].text : 'text-muted-foreground opacity-50'}`} /></motion.div></div>
              <div className="text-center mb-4"><h3 className="font-display text-xl text-foreground mb-1">{selectedBadge.name}</h3><p className="text-muted-foreground text-sm">{selectedBadge.description}</p></div>
              <div className="glass-card p-3 mb-4"><p className="text-xs text-muted-foreground mb-1">GEREKSINIM</p><p className="text-sm text-foreground">{selectedBadge.requirement}</p></div>
              {selectedBadge.unlocked ? (<div className="flex items-center justify-center gap-2 text-primary"><Sparkles className="w-4 h-4" /><span className="text-sm">{selectedBadge.unlockedAt && new Date(selectedBadge.unlockedAt).toLocaleDateString('tr-TR')} tarihinde açıldı</span></div>) : selectedBadge.progress !== undefined ? (<div><div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">İLERLEME</span><span className="text-xs text-primary">{selectedBadge.progressText}</span></div><div className="h-2 bg-secondary rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${selectedBadge.progress}%` }} className="h-full bg-primary rounded-full" /></div></div>) : null}
              <div className="mt-4 text-center"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${selectedBadge.unlocked ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>+{selectedBadge.xpReward} XP</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Achievements;
