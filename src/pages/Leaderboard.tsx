import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Flame, Dumbbell, Coins, ChevronLeft, TrendingUp, TrendingDown, Minus, Swords } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hapticLight } from "@/lib/haptics";
import ChallengesSection from "@/components/ChallengesSection";
import ChallengeHistoryModal from "@/components/ChallengeHistoryModal";

const mockAthletes = [
  { id: "1", name: "Ahmet Yılmaz", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", bioCoins: 8450, volume: 125000, streak: 45, challengeWins: 28, winStreak: 7, lastWeekRank: { bioCoins: 1, volume: 2, streak: 1, challenges: 2 } },
  { id: "2", name: "Mehmet Demir", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", bioCoins: 7890, volume: 118500, streak: 38, challengeWins: 32, winStreak: 5, lastWeekRank: { bioCoins: 3, volume: 1, streak: 3, challenges: 1 } },
  { id: "3", name: "Zeynep Kaya", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", bioCoins: 7200, volume: 95000, streak: 42, challengeWins: 24, winStreak: 9, lastWeekRank: { bioCoins: 2, volume: 5, streak: 2, challenges: 4 } },
  { id: "4", name: "Burak Şahin", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", bioCoins: 6950, volume: 112000, streak: 35, challengeWins: 21, winStreak: 4, lastWeekRank: { bioCoins: 5, volume: 3, streak: 5, challenges: 5 } },
  { id: "5", name: "Elif Çelik", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", bioCoins: 6700, volume: 88000, streak: 30, challengeWins: 19, winStreak: 6, lastWeekRank: { bioCoins: 4, volume: 6, streak: 4, challenges: 3 } },
  { id: "current", name: "Ahmet Kaya", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop", bioCoins: 3950, volume: 62000, streak: 17, challengeWins: 8, winStreak: 3, isCurrentUser: true, lastWeekRank: { bioCoins: 17, volume: 14, streak: 14, challenges: 16 } },
];

type MetricType = "bioCoins" | "volume" | "streak" | "challenges";
const getChallengeScore = (a: typeof mockAthletes[0]) => a.challengeWins + (a.winStreak * 2);
const getMetricValue = (a: typeof mockAthletes[0], m: MetricType) => { switch(m) { case "bioCoins": return a.bioCoins; case "volume": return a.volume; case "streak": return a.streak; case "challenges": return getChallengeScore(a); } };
const formatMetricValue = (v: number, m: MetricType, a?: typeof mockAthletes[0]) => { switch(m) { case "bioCoins": return v.toLocaleString("tr-TR"); case "volume": return `${(v/1000).toFixed(0)}k kg`; case "streak": return `${v} gün`; case "challenges": return a ? `${a.challengeWins}W` : `${v} puan`; } };
const getMetricIcon = (m: MetricType) => { switch(m) { case "bioCoins": return Coins; case "volume": return Dumbbell; case "streak": return Flame; case "challenges": return Swords; } };

const RankChangeIndicator = ({ currentRank, lastWeekRank }: { currentRank: number; lastWeekRank: number }) => {
  const change = lastWeekRank - currentRank;
  if (change === 0) return <span className="flex items-center text-muted-foreground text-[10px]"><Minus className="w-3 h-3" /></span>;
  if (change > 0) return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-medium"><TrendingUp className="w-3 h-3" /><span>+{change}</span></motion.span>;
  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 text-red-400 text-[10px] font-medium"><TrendingDown className="w-3 h-3" /><span>{change}</span></motion.span>;
};

const getPodiumStyle = (rank: number) => {
  if (rank === 1) return { size: "w-20 h-20", ring: "ring-4 ring-yellow-400", glow: "shadow-[0_0_30px_rgba(250,204,21,0.6)]", badge: "🥇", gradient: "from-yellow-400 via-yellow-500 to-amber-600", order: 2, height: "h-28" };
  if (rank === 2) return { size: "w-16 h-16", ring: "ring-3 ring-gray-300", glow: "shadow-[0_0_20px_rgba(156,163,175,0.5)]", badge: "🥈", gradient: "from-gray-300 via-gray-400 to-gray-500", order: 1, height: "h-20" };
  if (rank === 3) return { size: "w-16 h-16", ring: "ring-3 ring-amber-600", glow: "shadow-[0_0_20px_rgba(217,119,6,0.5)]", badge: "🥉", gradient: "from-amber-500 via-amber-600 to-amber-700", order: 3, height: "h-16" };
  return null;
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const [metric, setMetric] = useState<MetricType>("bioCoins");
  const [activeTab, setActiveTab] = useState<"leaderboard" | "challenges">("leaderboard");
  const [selectedAthlete, setSelectedAthlete] = useState<typeof mockAthletes[0] | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [activeTab]);

  const sortedAthletes = [...mockAthletes].sort((a, b) => getMetricValue(b, metric) - getMetricValue(a, metric));
  const top3 = sortedAthletes.slice(0, 3);
  const rest = sortedAthletes.slice(3);
  const currentUser = sortedAthletes.find(a => a.id === "current");
  const currentUserRank = sortedAthletes.findIndex(a => a.id === "current") + 1;
  const MetricIcon = getMetricIcon(metric);

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <div className="shrink-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4 relative z-50">
          <button onClick={() => { hapticLight(); navigate(-1); }} className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"><ChevronLeft className="w-6 h-6 text-foreground" /></button>
          <h1 className="font-display text-lg text-foreground tracking-wider">ATLET LİGİ</h1>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => { hapticLight(); setActiveTab(v as any); }}>
            <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-white/5">
              <TabsTrigger value="leaderboard" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"><Trophy className="w-3 h-3" />SIRALAMA</TabsTrigger>
              <TabsTrigger value="challenges" className="font-display text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"><Swords className="w-3 h-3" />MEYDAN OKUMA</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-6">
        {activeTab === "challenges" && <ChallengesSection athletes={mockAthletes} />}
        {activeTab === "leaderboard" && (
          <>
            <Tabs value={metric} onValueChange={(v) => { hapticLight(); setMetric(v as MetricType); }}>
              <TabsList className="w-full grid grid-cols-4 bg-secondary/50 border border-white/5">
                <TabsTrigger value="bioCoins" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 px-1"><Coins className="w-3 h-3" />COİN</TabsTrigger>
                <TabsTrigger value="volume" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 px-1"><Dumbbell className="w-3 h-3" />TONAJ</TabsTrigger>
                <TabsTrigger value="streak" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 px-1"><Flame className="w-3 h-3" />SERİ</TabsTrigger>
                <TabsTrigger value="challenges" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 px-1"><Swords className="w-3 h-3" />DÜELLO</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Top 3 Podium */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <div className="flex items-center justify-center gap-2 mb-6"><Trophy className="w-5 h-5 text-primary" /><span className="font-display text-sm text-foreground tracking-wide">PODYUM</span></div>
              <div className="flex items-end justify-center gap-4">
                {[2, 1, 3].map((position) => {
                  const athlete = top3[position - 1];
                  const style = getPodiumStyle(position);
                  if (!athlete || !style) return null;
                  return (
                    <motion.div key={athlete.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: position * 0.1 }} className="flex flex-col items-center cursor-pointer" style={{ order: style.order }}>
                      <div className={`relative ${style.glow} rounded-full`}>
                        <Avatar className={`${style.size} ${style.ring} bg-transparent`}><AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover rounded-full" /><AvatarFallback className="bg-primary/20 text-primary font-display rounded-full">{athlete.name.charAt(0)}</AvatarFallback></Avatar>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">{style.badge}</div>
                      </div>
                      <p className="mt-4 text-foreground text-xs font-medium text-center max-w-16 truncate">{athlete.name.split(" ")[0]}</p>
                      <RankChangeIndicator currentRank={position} lastWeekRank={athlete.lastWeekRank[metric]} />
                      <div className="flex items-center gap-1 mt-1"><MetricIcon className="w-3 h-3 text-primary" /><span className="font-display text-primary text-sm tabular-nums">{formatMetricValue(getMetricValue(athlete, metric), metric, athlete)}</span></div>
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className={`mt-3 w-16 ${style.height} rounded-t-lg bg-gradient-to-b ${style.gradient} flex items-center justify-center`}><span className="font-display text-2xl text-white/80">{position}</span></motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Rest of leaderboard */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-2">
              {rest.map((athlete, index) => {
                const rank = index + 4;
                const isCurrentUser = athlete.id === "current";
                return (
                  <motion.div key={athlete.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.03 }} className={`glass-card p-3 flex items-center gap-3 ${isCurrentUser ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-secondary"}`}><span className="font-display text-xs">#{rank}</span></div>
                      <RankChangeIndicator currentRank={rank} lastWeekRank={athlete.lastWeekRank[metric]} />
                    </div>
                    <Avatar className="w-10 h-10"><AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover" /><AvatarFallback className="bg-primary/20 text-primary text-xs">{athlete.name.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>{athlete.name}{isCurrentUser && <span className="text-primary ml-1">(Sen)</span>}</p>
                      <div className="flex items-center gap-3 text-muted-foreground text-[10px]"><span className="flex items-center gap-1"><Coins className="w-3 h-3" />{athlete.bioCoins.toLocaleString("tr-TR")}</span><span className="flex items-center gap-1"><Flame className="w-3 h-3" />{athlete.streak} gün</span></div>
                    </div>
                    <div className="text-right"><div className="flex items-center gap-1 justify-end"><MetricIcon className="w-3 h-3 text-primary" /><span className="font-display text-sm text-primary tabular-nums">{formatMetricValue(getMetricValue(athlete, metric), metric, athlete)}</span></div></div>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      {currentUser && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-[430px] mx-auto p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20"><span className="font-display text-lg text-primary-foreground">#{currentUserRank}</span></div>
            <Avatar className="w-12 h-12 ring-2 ring-primary"><AvatarImage src={currentUser.avatar} className="object-cover" /><AvatarFallback className="bg-primary/20 text-primary">AK</AvatarFallback></Avatar>
            <div className="flex-1"><p className="text-foreground font-display text-sm">SENİN SIRAN</p><p className="text-muted-foreground text-xs">Sıralamanı yükselt!</p></div>
            <div className="flex items-center gap-1"><MetricIcon className="w-4 h-4 text-primary" /><span className="font-display text-lg text-primary tabular-nums">{formatMetricValue(getMetricValue(currentUser, metric), metric, currentUser)}</span></div>
          </div>
        </motion.div>
      )}

      <ChallengeHistoryModal isOpen={false} onClose={() => {}} athlete={null} />
    </div>
  );
};

export default Leaderboard;
