import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Flame, Dumbbell, Coins, ChevronLeft, Swords, TrendingUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { hapticLight } from "@/lib/haptics";
import ChallengesSection from "@/components/ChallengesSection";
import ChallengeHistoryModal from "@/components/ChallengeHistoryModal";
import { useLeaderboard, LeaderboardMetric, LeaderboardAthlete, metricAccessor } from "@/hooks/useLeaderboard";

const metricConfig: Record<LeaderboardMetric, { icon: typeof Coins; label: string; format: (a: LeaderboardAthlete) => string }> = {
  bioCoins: { icon: Coins, label: "COİN", format: (a) => a.bioCoins.toLocaleString("tr-TR") },
  volume: { icon: Dumbbell, label: "TONAJ", format: (a) => `${(a.volume / 1000).toFixed(0)}k kg` },
  streak: { icon: Flame, label: "SERİ", format: (a) => `${a.streak} gün` },
  score: { icon: TrendingUp, label: "SKOR", format: (a) => a.score.toLocaleString("tr-TR") },
};

const getPodiumStyle = (rank: number) => {
  switch (rank) {
    case 1: return { size: "w-20 h-20", ring: "ring-4 ring-yellow-400", glow: "shadow-[0_0_30px_rgba(250,204,21,0.6)]", badge: "🥇", gradient: "from-yellow-400 via-yellow-500 to-amber-600", order: 2, height: "h-28" };
    case 2: return { size: "w-16 h-16", ring: "ring-3 ring-gray-300", glow: "shadow-[0_0_20px_rgba(156,163,175,0.5)]", badge: "🥈", gradient: "from-gray-300 via-gray-400 to-gray-500", order: 1, height: "h-20" };
    case 3: return { size: "w-16 h-16", ring: "ring-3 ring-amber-600", glow: "shadow-[0_0_20px_rgba(217,119,6,0.5)]", badge: "🥉", gradient: "from-amber-500 via-amber-600 to-amber-700", order: 3, height: "h-16" };
    default: return null;
  }
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<LeaderboardMetric>("bioCoins");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "challenges">("leaderboard");
  const [selectedAthlete, setSelectedAthlete] = useState<{
    id: string; name: string; avatar: string;
    rankScore: number; rankCoins: number; rankVolume: number; rankStreak: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { leaderboard, currentUserRank, isLoading } = useLeaderboard(metric);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const currentUser = leaderboard.find((a) => a.isCurrentUser);
  const cfg = metricConfig[metric];
  const MetricIcon = cfg.icon;

  const getBottomBarMessage = () => {
    if (!currentUser || currentUserRank <= 0) return "Sıralamanı yükselt!";
    if (currentUserRank === 1) return "Zirvedesin! 🏆";
    const above = leaderboard[currentUserRank - 2];
    const accessor = metric === "bioCoins" ? (a: LeaderboardAthlete) => a.bioCoins : metric === "volume" ? (a: LeaderboardAthlete) => a.volume : metric === "streak" ? (a: LeaderboardAthlete) => a.streak : (a: LeaderboardAthlete) => a.score;
    const diff = accessor(above) - accessor(currentUser);
    return `${diff.toLocaleString("tr-TR")} ${metric === "volume" ? "kg" : metric === "streak" ? "gün" : "puan"} ile #${currentUserRank - 1}'e yüksel`;
  };

  const challengeAthletes = leaderboard.map((a) => ({
    id: a.id, name: a.name, avatar: a.avatar, bioCoins: a.bioCoins, volume: a.volume, streak: a.streak,
  }));

  const handleAthleteClick = (athlete: LeaderboardAthlete) => {
    hapticLight();
    const getRank = (m: LeaderboardMetric) => {
      const sorted = [...leaderboard].sort((a, b) => metricAccessor[m](b) - metricAccessor[m](a));
      return sorted.findIndex((a) => a.id === athlete.id) + 1;
    };
    setSelectedAthlete({
      id: athlete.id, name: athlete.name, avatar: athlete.avatar,
      rankScore: getRank("score"), rankCoins: getRank("bioCoins"),
      rankVolume: getRank("volume"), rankStreak: getRank("streak"),
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4 relative z-50">
          <button onClick={() => { hapticLight(); navigate(-1); }} className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all" aria-label="Geri Dön">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="font-display text-lg text-foreground tracking-wider">ATLET LİGİ</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => { hapticLight(); setActiveTab(v as "leaderboard" | "challenges"); }}>
            <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-white/5">
              <TabsTrigger value="leaderboard" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"><Trophy className="w-3 h-3" />SIRALAMA</TabsTrigger>
              <TabsTrigger value="challenges" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"><Swords className="w-3 h-3" />MEYDAN OKUMA</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        {activeTab === "challenges" && <ChallengesSection athletes={challengeAthletes} />}
        {activeTab === "leaderboard" && (
          <>
            {/* Metric Tabs */}
            <Tabs value={metric} onValueChange={(v) => { hapticLight(); setMetric(v as LeaderboardMetric); }}>
              <TabsList className="w-full grid grid-cols-4 bg-secondary/50 border border-white/5">
                {(Object.keys(metricConfig) as LeaderboardMetric[]).map((m) => {
                  const Icon = metricConfig[m].icon;
                  return (
                    <TabsTrigger key={m} value={m} className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 px-1">
                      <Icon className="w-3 h-3" />{metricConfig[m].label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-64 w-full rounded-xl" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )}

            {/* Podium */}
            {!isLoading && top3.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="font-display text-sm text-foreground tracking-wide">PODYUM</span>
                </div>
                <div className="flex items-end justify-center gap-4">
                  {[2, 1, 3].map((position) => {
                    const athlete = top3[position - 1];
                    const style = getPodiumStyle(position);
                    if (!athlete || !style) return null;
                    return (
                      <motion.div
                        key={athlete.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: position * 0.1 }}
                        className="flex flex-col items-center cursor-pointer"
                        style={{ order: style.order }}
                        onClick={() => handleAthleteClick(athlete)}
                      >
                        <div className={`relative ${style.glow} rounded-full`}>
                          <Avatar className={`${style.size} ${style.ring} bg-transparent`}>
                            <AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover rounded-full" />
                            <AvatarFallback className="bg-primary/20 text-primary font-display rounded-full">{athlete.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">{style.badge}</div>
                        </div>
                        <p className="mt-4 text-foreground text-xs font-medium text-center max-w-16 truncate">{athlete.name.split(" ")[0]}</p>
                        {position === 1 && <span className="text-[9px] text-yellow-400 font-display tracking-wider">HÜKÜMDAR</span>}
                        {position === 2 && <span className="text-[9px] text-gray-400 font-display tracking-wider">ZİRVE</span>}
                        {position === 3 && <span className="text-[9px] text-amber-500 font-display tracking-wider">ZİRVE</span>}
                        <div className="flex items-center gap-1 mt-1">
                          <MetricIcon className="w-3 h-3 text-primary" />
                          <span className="font-display text-primary text-sm tabular-nums">{cfg.format(athlete)}</span>
                        </div>
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className={`mt-3 w-16 ${style.height} rounded-t-lg bg-gradient-to-b ${style.gradient} flex items-center justify-center`}>
                          <span className="font-display text-2xl text-white/80">{position}</span>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Empty State */}
            {!isLoading && leaderboard.length === 0 && (
              <div className="glass-card p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-display text-sm">Henüz sıralamada atlet yok</p>
                <p className="text-muted-foreground text-xs mt-1">Antrenman yapmaya başla ve ligi domine et!</p>
              </div>
            )}

            {/* Rest of Leaderboard */}
            {!isLoading && rest.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Sıralama</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-muted-foreground text-[10px]">{leaderboard.length} Atlet</span>
                </div>
                {rest.map((athlete, index) => {
                  const rank = index + 4;
                  return (
                    <motion.div
                      key={athlete.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                      className={`glass-card p-3 flex items-center gap-3 cursor-pointer ${athlete.isCurrentUser ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
                      onClick={() => handleAthleteClick(athlete)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${athlete.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        <span className="font-display text-xs">#{rank}</span>
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">{athlete.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${athlete.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                          {athlete.name}{athlete.isCurrentUser && <span className="text-primary ml-1">(Sen)</span>}
                        </p>
                        <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                          <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{athlete.bioCoins.toLocaleString("tr-TR")}</span>
                          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{athlete.streak} gün</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <MetricIcon className="w-3 h-3 text-primary" />
                          <span className="font-display text-sm text-primary tabular-nums">{cfg.format(athlete)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Bottom Bar */}
      {activeTab === "leaderboard" && currentUser && currentUserRank > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-[430px] mx-auto p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-display text-lg text-primary-foreground">#{currentUserRank}</span>
            </div>
            <Avatar className="w-12 h-12 ring-2 ring-primary">
              <AvatarImage src={currentUser.avatar} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary">{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-foreground font-display text-sm">SENİN SIRAN</p>
              <p className="text-muted-foreground text-xs">{getBottomBarMessage()}</p>
            </div>
            <div className="flex items-center gap-1">
              <MetricIcon className="w-4 h-4 text-primary" />
              <span className="font-display text-lg text-primary tabular-nums">{cfg.format(currentUser)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Athlete Duel History Modal */}
      <ChallengeHistoryModal
        isOpen={!!selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        athlete={selectedAthlete}
      />
    </div>
  );
};

export default Leaderboard;
