import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Swords, Flame, Target, Calendar, TrendingUp, Award, Dumbbell, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { hapticLight } from "@/lib/haptics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Athlete {
  id: string;
  name: string;
  avatar: string;
  rankScore?: number;
  rankCoins?: number;
  rankVolume?: number;
  rankStreak?: number;
}

interface ChallengeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: Athlete | null;
}

interface ChallengeRow {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenge_type: string;
  exercise_name: string | null;
  wager_coins: number | null;
  challenger_value: number | null;
  opponent_value: number | null;
  winner_id: string | null;
  created_at: string | null;
  end_date: string | null;
  status: string | null;
}

const ChallengeHistoryModal = ({ isOpen, onClose, athlete }: ChallengeHistoryModalProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "wins" | "losses">("all");

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["athlete-challenge-history", athlete?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .or(`challenger_id.eq.${athlete!.id},opponent_id.eq.${athlete!.id}`)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ChallengeRow[];
    },
    enabled: !!athlete?.id && isOpen,
    staleTime: 60_000,
  });

  // Fetch profiles for opponent display
  const opponentIds = [...new Set(challenges.map((c) =>
    c.challenger_id === athlete?.id ? c.opponent_id : c.challenger_id
  ))];

  const { data: profilesMap = new Map() } = useQuery({
    queryKey: ["challenge-history-profiles", opponentIds.join(",")],
    queryFn: async () => {
      if (opponentIds.length === 0) return new Map();
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", opponentIds);
      const map = new Map<string, { name: string; avatar: string }>();
      (data ?? []).forEach((p) => map.set(p.id, {
        name: p.full_name || "Atlet",
        avatar: p.avatar_url || "",
      }));
      return map;
    },
    enabled: opponentIds.length > 0 && isOpen,
    staleTime: 120_000,
  });

  if (!athlete) return null;

  const wins = challenges.filter((c) => c.winner_id === athlete.id);
  const losses = challenges.filter((c) => c.winner_id && c.winner_id !== athlete.id);
  const total = challenges.length;
  const winRate = total > 0 ? Math.round((wins.length / total) * 100) : 0;

  // Calculate win streak from most recent
  let winStreak = 0;
  for (const c of challenges) {
    if (c.winner_id === athlete.id) winStreak++;
    else break;
  }

  const filteredHistory = activeTab === "all" ? challenges : activeTab === "wins" ? wins : losses;
  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[85vh] p-0 gap-0 bg-background border-white/10 overflow-hidden flex flex-col [&>button]:hidden">
        <DialogHeader className="shrink-0 p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-primary">
                <AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary">{athlete.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="font-display text-base text-foreground">{athlete.name}</DialogTitle>
                <p className="text-muted-foreground text-xs">Düello Geçmişi</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="shrink-0 p-4 border-b border-white/10">
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1"><Swords className="w-4 h-4 text-primary" /></div>
                  <p className="font-display text-lg text-foreground">{total}</p>
                  <p className="text-muted-foreground text-[10px]">Toplam</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1"><Trophy className="w-4 h-4 text-emerald-400" /></div>
                  <p className="font-display text-lg text-emerald-400">{wins.length}</p>
                  <p className="text-muted-foreground text-[10px]">Galibiyet</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1"><X className="w-4 h-4 text-red-400" /></div>
                  <p className="font-display text-lg text-red-400">{losses.length}</p>
                  <p className="text-muted-foreground text-[10px]">Mağlubiyet</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1"><TrendingUp className="w-4 h-4 text-primary" /></div>
                  <p className="font-display text-lg text-primary">%{winRate}</p>
                  <p className="text-muted-foreground text-[10px]">Başarı</p>
                </div>
              </div>
              {winStreak > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 glass-card p-3 flex items-center justify-between bg-amber-500/10 border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Flame className="w-4 h-4 text-amber-400" /></div>
                    <div>
                      <p className="text-amber-400 font-display text-sm">Aktif Galibiyet Serisi</p>
                      <p className="text-muted-foreground text-[10px]">Arka arkaya kazanıyor!</p>
                    </div>
                  </div>
                  <span className="font-display text-2xl text-amber-400">{winStreak}🔥</span>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="shrink-0 px-4 pt-3">
          <Tabs value={activeTab} onValueChange={(v) => { hapticLight(); setActiveTab(v as typeof activeTab); }}>
            <TabsList className="w-full grid grid-cols-3 bg-secondary/50 border border-white/5">
              <TabsTrigger value="all" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tümü ({total})</TabsTrigger>
              <TabsTrigger value="wins" className="font-display text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Galibiyet ({wins.length})</TabsTrigger>
              <TabsTrigger value="losses" className="font-display text-xs data-[state=active]:bg-red-500 data-[state=active]:text-white">Mağlubiyet ({losses.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 py-3">
          <div className="space-y-2 pb-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((challenge, index) => {
                  const isWin = challenge.winner_id === athlete.id;
                  const opponentId = challenge.challenger_id === athlete.id ? challenge.opponent_id : challenge.challenger_id;
                  const opponentInfo = profilesMap.get(opponentId);
                  const yourValue = challenge.challenger_id === athlete.id
                    ? Number(challenge.challenger_value ?? 0)
                    : Number(challenge.opponent_value ?? 0);
                  const theirValue = challenge.challenger_id === athlete.id
                    ? Number(challenge.opponent_value ?? 0)
                    : Number(challenge.challenger_value ?? 0);

                  return (
                    <motion.div key={challenge.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}
                      className={`glass-card p-3 ${isWin ? "border-l-2 border-l-emerald-500" : "border-l-2 border-l-red-500"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWin ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                          {isWin ? <Trophy className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isWin ? "text-emerald-400" : "text-red-400"}`}>{isWin ? "Kazandı" : "Kaybetti"}</span>
                            <span className="text-muted-foreground text-xs">vs</span>
                            <span className="text-foreground text-sm truncate">{opponentInfo?.name?.split(" ")[0] || "Atlet"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                            {challenge.challenge_type === "pr" ? (
                              <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{challenge.exercise_name || "PR"}</span>
                            ) : (
                              <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Antrenman Serisi</span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(challenge.created_at)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <span className={`font-display text-sm ${isWin ? "text-emerald-400" : "text-red-400"}`}>{yourValue}</span>
                            <span className="text-muted-foreground text-xs">-</span>
                            <span className="text-muted-foreground text-sm">{theirValue}</span>
                          </div>
                          {isWin && challenge.wager_coins && (
                            <span className="text-yellow-400 text-[10px]">+{challenge.wager_coins} coin</span>
                          )}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={opponentInfo?.avatar} className="object-cover" />
                          <AvatarFallback className="bg-secondary text-xs">{opponentInfo?.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            {!isLoading && filteredHistory.length === 0 && (
              <div className="text-center py-8">
                <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Bu kategoride düello bulunamadı</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeHistoryModal;
