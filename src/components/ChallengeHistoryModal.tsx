import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Swords, Flame, Target, Calendar, TrendingUp, Award, Dumbbell, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hapticLight } from "@/lib/haptics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChallengeResult {
  id: string; type: "pr" | "streak"; exercise?: string; opponentId: string; opponentName: string; opponentAvatar: string;
  result: "won" | "lost"; yourValue: number; opponentValue: number; targetValue: number; bioCoinsWon?: number; date: string;
}

interface Athlete { id: string; name: string; avatar: string; challengeWins: number; winStreak: number; }

interface ChallengeHistoryModalProps { isOpen: boolean; onClose: () => void; athlete: Athlete | null; }

const generateChallengeHistory = (athlete: Athlete): ChallengeResult[] => {
  const opponents = [
    { id: "1", name: "Ahmet Yılmaz", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    { id: "2", name: "Mehmet Demir", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
    { id: "3", name: "Zeynep Kaya", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
    { id: "4", name: "Burak Şahin", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
    { id: "5", name: "Elif Çelik", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  ].filter(o => o.id !== athlete.id);
  const exercises = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row"];
  const results: ChallengeResult[] = [];
  const totalChallenges = athlete.challengeWins + Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < Math.min(totalChallenges, 15); i++) {
    const opponent = opponents[i % opponents.length];
    const isWin = i < athlete.challengeWins;
    const isPR = Math.random() > 0.3;
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (i * 3 + Math.floor(Math.random() * 5)));
    results.push({
      id: `ch-${athlete.id}-${i}`, type: isPR ? "pr" : "streak", exercise: isPR ? exercises[i % exercises.length] : undefined,
      opponentId: opponent.id, opponentName: opponent.name, opponentAvatar: opponent.avatar,
      result: isWin ? "won" : "lost",
      yourValue: isPR ? 100 + Math.floor(Math.random() * 60) : 7 + Math.floor(Math.random() * 14),
      opponentValue: isPR ? 95 + Math.floor(Math.random() * 55) : 5 + Math.floor(Math.random() * 16),
      targetValue: isPR ? 120 + Math.floor(Math.random() * 30) : 14,
      bioCoinsWon: isWin ? 100 + Math.floor(Math.random() * 150) : 0,
      date: baseDate.toISOString(),
    });
  }
  return results;
};

const ChallengeHistoryModal = ({ isOpen, onClose, athlete }: ChallengeHistoryModalProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "wins" | "losses">("all");
  if (!athlete) return null;
  const history = generateChallengeHistory(athlete);
  const wins = history.filter(h => h.result === "won");
  const losses = history.filter(h => h.result === "lost");
  const winRate = history.length > 0 ? Math.round((wins.length / history.length) * 100) : 0;
  const filteredHistory = activeTab === "all" ? history : activeTab === "wins" ? wins : losses;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] p-0 gap-0 bg-background border-white/10 overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-primary"><AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover" /><AvatarFallback className="bg-primary/20 text-primary">{athlete.name.charAt(0)}</AvatarFallback></Avatar>
              <div><DialogTitle className="font-display text-base text-foreground">{athlete.name}</DialogTitle><p className="text-muted-foreground text-xs">Düello Geçmişi</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
        </DialogHeader>

        <div className="shrink-0 p-4 border-b border-white/10">
          <div className="grid grid-cols-4 gap-2">
            <div className="glass-card p-3 text-center"><div className="flex items-center justify-center gap-1 mb-1"><Swords className="w-4 h-4 text-primary" /></div><p className="font-display text-lg text-foreground">{history.length}</p><p className="text-muted-foreground text-[10px]">Toplam</p></div>
            <div className="glass-card p-3 text-center"><div className="flex items-center justify-center gap-1 mb-1"><Trophy className="w-4 h-4 text-emerald-400" /></div><p className="font-display text-lg text-emerald-400">{wins.length}</p><p className="text-muted-foreground text-[10px]">Galibiyet</p></div>
            <div className="glass-card p-3 text-center"><div className="flex items-center justify-center gap-1 mb-1"><X className="w-4 h-4 text-red-400" /></div><p className="font-display text-lg text-red-400">{losses.length}</p><p className="text-muted-foreground text-[10px]">Mağlubiyet</p></div>
            <div className="glass-card p-3 text-center"><div className="flex items-center justify-center gap-1 mb-1"><TrendingUp className="w-4 h-4 text-primary" /></div><p className="font-display text-lg text-primary">%{winRate}</p><p className="text-muted-foreground text-[10px]">Başarı</p></div>
          </div>
          {athlete.winStreak > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 glass-card p-3 flex items-center justify-between bg-amber-500/10 border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Flame className="w-4 h-4 text-amber-400" /></div>
                <div><p className="text-amber-400 font-display text-sm">Aktif Galibiyet Serisi</p><p className="text-muted-foreground text-[10px]">Arka arkaya kazanıyor!</p></div>
              </div>
              <span className="font-display text-2xl text-amber-400">{athlete.winStreak}🔥</span>
            </motion.div>
          )}
        </div>

        <div className="shrink-0 px-4 pt-3">
          <Tabs value={activeTab} onValueChange={(v) => { hapticLight(); setActiveTab(v as typeof activeTab); }}>
            <TabsList className="w-full grid grid-cols-3 bg-secondary/50 border border-white/5">
              <TabsTrigger value="all" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tümü ({history.length})</TabsTrigger>
              <TabsTrigger value="wins" className="font-display text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Galibiyet ({wins.length})</TabsTrigger>
              <TabsTrigger value="losses" className="font-display text-xs data-[state=active]:bg-red-500 data-[state=active]:text-white">Mağlubiyet ({losses.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 py-3">
          <div className="space-y-2 pb-4">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((challenge, index) => (
                <motion.div key={challenge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}
                  className={`glass-card p-3 ${challenge.result === "won" ? "border-l-2 border-l-emerald-500" : "border-l-2 border-l-red-500"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${challenge.result === "won" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                      {challenge.result === "won" ? <Trophy className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${challenge.result === "won" ? "text-emerald-400" : "text-red-400"}`}>{challenge.result === "won" ? "Kazandı" : "Kaybetti"}</span>
                        <span className="text-muted-foreground text-xs">vs</span>
                        <span className="text-foreground text-sm truncate">{challenge.opponentName.split(" ")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                        {challenge.type === "pr" ? <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{challenge.exercise}</span> : <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Antrenman Serisi</span>}
                        <span>•</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(challenge.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`font-display text-sm ${challenge.result === "won" ? "text-emerald-400" : "text-red-400"}`}>{challenge.yourValue}</span>
                        <span className="text-muted-foreground text-xs">-</span>
                        <span className="text-muted-foreground text-sm">{challenge.opponentValue}</span>
                      </div>
                      {challenge.result === "won" && challenge.bioCoinsWon && <span className="text-yellow-400 text-[10px]">+{challenge.bioCoinsWon} coin</span>}
                    </div>
                    <Avatar className="w-8 h-8"><AvatarImage src={challenge.opponentAvatar} className="object-cover" /><AvatarFallback className="bg-secondary text-xs">{challenge.opponentName.charAt(0)}</AvatarFallback></Avatar>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredHistory.length === 0 && (
              <div className="text-center py-8"><Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground text-sm">Bu kategoride düello bulunamadı</p></div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeHistoryModal;
