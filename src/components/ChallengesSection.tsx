import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Clock, CheckCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ChallengeCard from "./ChallengeCard";
import CreateChallengeModal from "./CreateChallengeModal";
import ChallengeDetailModal from "./ChallengeDetailModal";
import ChallengeStreakBanner from "./ChallengeStreakBanner";
import { Challenge } from "@/lib/challengeData";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { useChallenges } from "@/hooks/useChallenges";

interface ChallengesSectionProps {
  athletes: Array<{ id: string; name: string; avatar: string; bioCoins: number; volume: number; streak: number; }>;
}

type FilterType = "all" | "pending" | "active" | "completed";

const ChallengesSection = ({ athletes }: ChallengesSectionProps) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const { challenges, pending, active, completed, isLoading, acceptChallenge, declineChallenge } = useChallenges();

  const filteredChallenges = filter === "all" ? challenges
    : filter === "pending" ? pending
    : filter === "active" ? active
    : completed;

  const pendingCount = pending.filter(ch => ch.challengedId === "current").length;

  const handleAcceptChallenge = (id: string) => { acceptChallenge(id); };
  const handleDeclineChallenge = (id: string) => { declineChallenge(id); };
  const handleViewDetails = (challenge: Challenge) => setSelectedChallenge(challenge);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            <h2 className="font-display text-base text-foreground tracking-wide">MEYDAN OKUMALAR</h2>
            {pendingCount > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-yellow-500 text-background text-xs font-bold flex items-center justify-center">{pendingCount}</motion.span>}
          </div>
          <Button size="sm" onClick={() => { hapticMedium(); setShowCreateModal(true); }} className="h-9 px-4 bg-primary hover:bg-primary/90 font-display text-xs tracking-wider rounded-lg">
            <Plus className="w-3 h-3 mr-1" />MEYDAN OKU
          </Button>
        </div>

        <div><ChallengeStreakBanner showDevTools={true} /></div>

        <div className="sticky top-0 z-10 py-2 -mx-4 px-4 bg-background/95 backdrop-blur-sm">
          <Tabs value={filter} onValueChange={(v) => { hapticLight(); setFilter(v as FilterType); }}>
            <TabsList className="w-full grid grid-cols-4 bg-secondary/50 border border-white/5">
              <TabsTrigger value="all" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tümü</TabsTrigger>
              <TabsTrigger value="pending" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
                <Clock className="w-3 h-3" />Bekleyen
                {pendingCount > 0 && <span className="w-4 h-4 rounded-full bg-yellow-500 text-background text-[8px] font-bold flex items-center justify-center">{pendingCount}</span>}
              </TabsTrigger>
              <TabsTrigger value="active" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"><Swords className="w-3 h-3" />Aktif</TabsTrigger>
              <TabsTrigger value="completed" className="font-display text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1"><CheckCircle className="w-3 h-3" />Biten</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredChallenges.length > 0 ? (
                filteredChallenges.map((challenge, index) => (
                  <motion.div key={challenge.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }} className="relative">
                    <ChallengeCard challenge={challenge} onAccept={handleAcceptChallenge} onDecline={handleDeclineChallenge} onViewDetails={handleViewDetails} />
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"><Swords className="w-8 h-8 text-primary/50" /></div>
                  <p className="text-foreground font-display text-sm mb-1">Hareket Yok</p>
                  <p className="text-muted-foreground text-xs mb-4">
                    {filter === "pending" && "Bekleyen meydan okuman yok"}
                    {filter === "active" && "Aktif meydan okuman yok"}
                    {filter === "completed" && "Tamamlanan meydan okuman yok"}
                    {filter === "all" && "Henüz hiç meydan okuma yapılmamış."}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)} className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"><Plus className="w-4 h-4 mr-1" />Meydan Oku</Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {!isLoading && challenges.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="glass-card p-3 text-center"><p className="text-primary font-display text-xl">{active.length}</p><p className="text-muted-foreground text-[10px]">AKTİF</p></div>
            <div className="glass-card p-3 text-center"><p className="text-emerald-400 font-display text-xl">{completed.filter(c => c.winnerId === "current").length}</p><p className="text-muted-foreground text-[10px]">KAZANILAN</p></div>
            <div className="glass-card p-3 text-center"><p className="text-yellow-400 font-display text-xl">{completed.reduce((sum, c) => c.winnerId === "current" ? sum + c.bioCoinsReward : sum, 0)}</p><p className="text-muted-foreground text-[10px]">COİN</p></div>
          </div>
        )}
      </motion.div>

      <CreateChallengeModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} athletes={athletes} />
      <ChallengeDetailModal isOpen={!!selectedChallenge} onClose={() => setSelectedChallenge(null)} challenge={selectedChallenge ? { id: selectedChallenge.id, title: selectedChallenge.exercise || selectedChallenge.type, type: selectedChallenge.type, target: String(selectedChallenge.targetValue), deadline: selectedChallenge.deadline, wager: selectedChallenge.bioCoinsReward, status: selectedChallenge.status === "active" ? "active" : selectedChallenge.status === "completed" ? "completed" : "pending" } : undefined} />
    </>
  );
};

export default ChallengesSection;
