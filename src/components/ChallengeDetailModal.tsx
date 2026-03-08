import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Trophy, MessageCircle, Clock, Camera, ChevronRight, Send, Medal, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  proofSubmitted: boolean;
}

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
  };
}

const mockParticipants: Participant[] = [
  { id: "1", name: "Ahmet", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80", score: 85, proofSubmitted: true },
  { id: "2", name: "Mehmet", avatar: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=80", score: 72, proofSubmitted: true },
];

const mockMessages = [
  { id: "1", sender: "Ahmet", text: "Bu sefer ben kazanacağım! 💪", time: "14:30" },
  { id: "2", sender: "Mehmet", text: "Rüyanda görürsün 😏", time: "14:32" },
  { id: "3", sender: "Ahmet", text: "Kanıtım hazır, yükledim bile!", time: "15:10" },
];

const ChallengeDetailModal = ({ isOpen, onClose, challenge }: ChallengeDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"vs" | "chat" | "proof" | "history">("vs");
  const [message, setMessage] = useState("");

  if (!isOpen || !challenge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden"
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
            {[
              { key: "vs", icon: Swords, label: "VS" },
              { key: "chat", icon: MessageCircle, label: "Mesajlar" },
              { key: "proof", icon: Camera, label: "Kanıt" },
              { key: "history", icon: History, label: "Geçmiş" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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
                {/* VS Display */}
                <div className="flex items-center justify-center gap-6 py-6">
                  {mockParticipants.map((p, i) => (
                    <div key={p.id} className="text-center">
                      <div className={`relative w-20 h-20 rounded-full overflow-hidden border-2 ${
                        i === 0 ? "border-primary" : "border-border"
                      }`}>
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-foreground text-sm font-medium mt-2">{p.name}</p>
                      <p className="text-primary text-2xl font-display font-bold">{p.score}</p>
                      <p className="text-muted-foreground text-xs">puan</p>
                      {p.proofSubmitted && (
                        <div className="flex items-center gap-1 justify-center mt-1 text-green-400 text-xs">
                          <Camera className="w-3 h-3" /> Kanıt var
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="absolute">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <span className="text-destructive font-bold text-sm">VS</span>
                    </div>
                  </div>
                </div>

                {/* Target */}
                <div className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
                  <p className="text-muted-foreground text-xs mb-1">Hedef</p>
                  <p className="text-foreground text-sm font-medium">{challenge.target}</p>
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="space-y-3">
                {mockMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "Ahmet" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                      msg.sender === "Ahmet" ? "bg-primary/20 text-foreground" : "bg-secondary text-foreground"
                    }`}>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">{msg.sender}</p>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[10px] text-muted-foreground text-right mt-0.5">{msg.time}</p>
                    </div>
                  </div>
                ))}
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

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {[
                  { date: "20 Oca", result: "Kazandın", coins: "+50", opponent: "Mehmet" },
                  { date: "13 Oca", result: "Kaybettin", coins: "-30", opponent: "Mehmet" },
                  { date: "6 Oca", result: "Kazandın", coins: "+40", opponent: "Elif" },
                ].map((entry, i) => (
                  <div key={i} className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">{entry.result}</p>
                      <p className="text-muted-foreground text-xs">vs {entry.opponent} • {entry.date}</p>
                    </div>
                    <span className={`text-sm font-bold ${entry.coins.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                      {entry.coins} 🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChallengeDetailModal;
