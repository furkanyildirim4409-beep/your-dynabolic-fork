import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Trophy, MessageCircle, Clock, Camera, Send, History } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChallenges } from "@/hooks/useChallenges";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ChallengeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge?: {
    id: string;
    title: string;
    type: string;
    target: string;
    deadline: string;
    wager: number;
    status: "active" | "completed" | "pending";
    challengerId?: string;
    challengerName?: string;
    challengerAvatar?: string;
    challengerValue?: number;
    challengedId?: string;
    challengedName?: string;
    challengedAvatar?: string;
    challengedValue?: number;
    winnerId?: string;
    opponentRealId?: string;
  };
}

const ChallengeDetailModal = ({ isOpen, onClose, challenge }: ChallengeDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"vs" | "chat" | "proof" | "history">("vs");
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { completed } = useChallenges();

  if (!isOpen || !challenge) return null;

  // Determine the real opponent ID for history filtering
  const opponentId = challenge.opponentRealId ||
    (challenge.challengerId === "current" ? challenge.challengedId : challenge.challengerId) || "";

  // Filter completed challenges between current user and this specific opponent
  const opponentHistory = completed.filter((c) => {
    const involvesCurrent = c.challengerId === "current" || c.challengedId === "current";
    const involvesOpponent = c.challengerId === opponentId || c.challengedId === opponentId;
    return involvesCurrent && involvesOpponent;
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[60] bg-background h-[100dvh] w-full flex flex-col rounded-none"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">{challenge.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {challenge.deadline}</span>
              <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-primary" /> {challenge.wager} Bio-Coin</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                challenge.status === "active" ? "bg-green-500/20 text-green-400" :
                challenge.status === "completed" ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {challenge.status === "active" ? "Aktif" : challenge.status === "completed" ? "Tamamlandı" : "Bekliyor"}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {([
              { key: "vs" as const, icon: Swords, label: "VS" },
              { key: "chat" as const, icon: MessageCircle, label: "Mesajlar" },
              { key: "proof" as const, icon: Camera, label: "Kanıt" },
              { key: "history" as const, icon: History, label: "Geçmiş" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.key ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(90vh - 200px)" }}>
            {/* VS Tab */}
            {activeTab === "vs" && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-6 py-6">
                  {/* Challenger */}
                  <div className="text-center">
                    <Avatar className="w-20 h-20 ring-2 ring-primary mx-auto">
                      <AvatarImage src={challenge.challengerAvatar} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg">
                        {(challenge.challengerName || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-foreground text-sm font-medium mt-2">{challenge.challengerName || "Rakip"}</p>
                    <p className="text-primary text-2xl font-display font-bold">{challenge.challengerValue ?? 0}</p>
                    <p className="text-muted-foreground text-xs">puan</p>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-destructive font-bold text-sm">VS</span>
                  </div>

                  {/* Challenged */}
                  <div className="text-center">
                    <Avatar className="w-20 h-20 ring-2 ring-border mx-auto">
                      <AvatarImage src={challenge.challengedAvatar} className="object-cover" />
                      <AvatarFallback className="bg-secondary text-foreground text-lg">
                        {(challenge.challengedName || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-foreground text-sm font-medium mt-2">{challenge.challengedName || "Rakip"}</p>
                    <p className="text-primary text-2xl font-display font-bold">{challenge.challengedValue ?? 0}</p>
                    <p className="text-muted-foreground text-xs">puan</p>
                  </div>
                </div>

                <div className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
                  <p className="text-muted-foreground text-xs mb-1">Hedef</p>
                  <p className="text-foreground text-sm font-medium">{challenge.target}</p>
                </div>

                {challenge.winnerId && (
                  <div className="glass-card p-4 bg-yellow-500/5 border-yellow-500/20 text-center">
                    <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-foreground font-display text-lg">
                      {challenge.winnerId === "current" ? "Sen Kazandın! 🎉" : "Rakip Kazandı"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab — Empty state */}
            {activeTab === "chat" && (
              <div className="space-y-3">
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-foreground text-sm font-medium">Henüz mesaj yok</p>
                  <p className="text-muted-foreground text-xs mt-1">Rakibine sataşmaya başla! 🔥</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mesaj yaz..."
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm"
                  />
                  <Button size="icon" className="rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Proof Tab */}
            {activeTab === "proof" && (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-foreground text-sm font-medium">Kanıt Yükle</p>
                <p className="text-muted-foreground text-xs mt-1 mb-4">Fotoğraf veya video ile kanıtla</p>
                <Button variant="outline" className="gap-2">
                  <Camera className="w-4 h-4" />
                  Fotoğraf Çek
                </Button>
              </div>
            )}

            {/* History Tab — Real data */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {opponentHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-foreground text-sm font-medium">Geçmiş düello yok</p>
                    <p className="text-muted-foreground text-xs mt-1">Bu rakiple ilk düellonuz!</p>
                  </div>
                ) : (
                  opponentHistory.map((entry) => {
                    const won = entry.winnerId === "current";
                    const coins = entry.bioCoinsReward || 0;
                    let dateStr = "";
                    try {
                      dateStr = format(new Date(entry.completedAt || entry.deadline), "d MMM", { locale: tr });
                    } catch {
                      dateStr = "";
                    }
                    const opponentName = entry.challengerId === "current" ? entry.challengedName : entry.challengerName;

                    return (
                      <div key={entry.id} className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-medium">{won ? "Kazandın 🏆" : "Kaybettin"}</p>
                          <p className="text-muted-foreground text-xs">
                            vs {opponentName} {dateStr && `• ${dateStr}`}
                            {entry.exercise && ` • ${entry.exercise}`}
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                          {won ? "+" : "-"}{coins} 🪙
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChallengeDetailModal;
