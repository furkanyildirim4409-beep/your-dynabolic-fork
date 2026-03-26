import { useState, useRef, useEffect } from "react";
import { CustomAudioPlayer } from "@/components/ui/CustomAudioPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Trophy, MessageCircle, Clock, Camera, Send, History, CheckCircle, Minus, Plus, UploadCloud, Image as ImageIcon, Video, Loader2, Paperclip, Mic } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChallenges } from "@/hooks/useChallenges";
import { useProofUpload } from "@/hooks/useProofUpload";
import { useChallengeChat } from "@/hooks/useChallengeChat";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
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
    status: "active" | "completed" | "pending" | "disputed";
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
    proofUrl?: string;
    opponentProofUrl?: string;
  };
}

const ChallengeDetailModal = ({ isOpen, onClose, challenge }: ChallengeDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"vs" | "chat" | "proof" | "history">("vs");
  const [message, setMessage] = useState("");
  const [myResult, setMyResult] = useState(0);
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { completed, submitResult, concludeChallenge, disputeChallenge } = useChallenges();
  const { uploadProof, isUploading } = useProofUpload();
  const { messages: chatMessages, sendMessage, isLoading: chatLoading } = useChallengeChat(challenge?.id || "");
  const { isRecording, recordingDuration, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!isOpen || !challenge) return null;

  const isChallenger = challenge.challengerId === "current";
  const myValue = isChallenger ? challenge.challengerValue : challenge.challengedValue;
  const opponentValue = isChallenger ? challenge.challengedValue : challenge.challengerValue;
  const myName = isChallenger ? challenge.challengerName : challenge.challengedName;
  const myAvatar = isChallenger ? challenge.challengerAvatar : challenge.challengedAvatar;
  const opponentName = isChallenger ? challenge.challengedName : challenge.challengerName;
  const opponentAvatar = isChallenger ? challenge.challengedAvatar : challenge.challengerAvatar;

  const opponentId = challenge.opponentRealId ||
    (challenge.challengerId === "current" ? challenge.challengedId : challenge.challengerId) || "";

  const opponentHistory = completed.filter((c) => {
    const involvesCurrent = c.challengerId === "current" || c.challengedId === "current";
    const involvesOpponent = c.challengerId === opponentId || c.challengedId === opponentId;
    return involvesCurrent && involvesOpponent;
  });

  const handleSubmitResult = async () => {
    if (myResult <= 0) return;
    await submitResult({ challengeId: challenge.id, value: myResult, isChallenger });
    setMyResult(0);
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !chatFile) return;
    setIsSendingChat(true);
    try {
      await sendMessage({ text: message.trim(), file: chatFile || undefined });
      setMessage("");
      setChatFile(null);
    } finally {
      setIsSendingChat(false);
    }
  };

  const adjustValue = (delta: number) => {
    setMyResult((prev) => Math.max(0, prev + delta));
  };

  // --- ScorePad Renderer ---
  const renderScorePad = (isCurrentUserSide: boolean, currentValue: number | undefined, name: string | undefined, avatar: string | undefined, ringClass: string) => {
    const showInput = challenge.status === "active" && isCurrentUserSide && (!currentValue || currentValue <= 0);
    const isLocked = isCurrentUserSide && currentValue && currentValue > 0;

    return (
      <div className="flex flex-col items-center gap-2">
        <Avatar className={`w-20 h-20 ring-4 ${ringClass}`}>
          <AvatarImage src={avatar} className="object-cover" />
          <AvatarFallback className="bg-secondary text-foreground text-xl font-display">
            {(name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-display text-sm font-bold text-foreground">{name || "Bilinmeyen"}</p>

        {showInput ? (
          <div className="flex flex-col items-center gap-3 mt-2">
            <p className="text-5xl font-display font-black text-primary tabular-nums">{myResult}</p>
            <div className="flex items-center gap-2">
              {[-10, -1].map((d) => (
                <button
                  key={d}
                  onClick={() => adjustValue(d)}
                  className="w-10 h-10 rounded-full bg-secondary/80 backdrop-blur border border-border text-foreground font-display text-sm font-bold flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors active:scale-90"
                >
                  {d}
                </button>
              ))}
              {[1, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => adjustValue(d)}
                  className="w-10 h-10 rounded-full bg-secondary/80 backdrop-blur border border-border text-foreground font-display text-sm font-bold flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors active:scale-90"
                >
                  +{d}
                </button>
              ))}
            </div>
            <Button
              onClick={handleSubmitResult}
              disabled={myResult <= 0}
              className="w-full h-14 text-lg font-bold font-display tracking-wider bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 hover:scale-[1.02] transition-transform rounded-xl shadow-lg"
            >
              ⚔️ SONUCU KAYDET
            </Button>
          </div>
        ) : isLocked ? (
          <div className="flex flex-col items-center gap-1 mt-1">
            <p className="text-3xl font-display font-black text-primary">{currentValue}</p>
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Kaydedildi</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 mt-1">
            <p className="text-3xl font-display font-black text-foreground/80">{currentValue ?? 0}</p>
            <p className="text-muted-foreground text-xs">{currentValue && currentValue > 0 ? "puan" : "Bekleniyor..."}</p>
          </div>
        )}
      </div>
    );
  };

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
                challenge.status === "disputed" ? "bg-amber-500/20 text-amber-400" :
                challenge.status === "active" ? "bg-green-500/20 text-green-400" :
                challenge.status === "completed" ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {challenge.status === "disputed" ? "İtiraz Edildi" : challenge.status === "active" ? "Aktif" : challenge.status === "completed" ? "Tamamlandı" : "Bekliyor"}
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
          <div className={`flex-1 overflow-y-auto ${activeTab === "chat" ? "flex flex-col" : "p-4"}`}>
            {/* VS Tab */}
            {activeTab === "vs" && (
              <div className="space-y-6">
                <div className="flex items-start justify-center gap-4 py-4">
                  {/* Current User Side */}
                  {renderScorePad(true, myValue, myName, myAvatar, "ring-primary/50")}

                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mt-6 shrink-0">
                    <span className="text-destructive font-display font-black text-sm">VS</span>
                  </div>

                  {/* Opponent Side */}
                  {renderScorePad(false, opponentValue, opponentName, opponentAvatar, "ring-destructive/50")}
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

                {/* Resolution buttons when both sides submitted */}
                {challenge.status === "active" && !challenge.winnerId &&
                  (challenge.challengerValue ?? 0) > 0 && (challenge.challengedValue ?? 0) > 0 && (
                  <div className="flex gap-3 mt-2">
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        const cVal = challenge.challengerValue ?? 0;
                        const dVal = challenge.challengedValue ?? 0;
                        const winnerId = cVal >= dVal
                          ? (isChallenger ? user?.id : opponentId)
                          : (isChallenger ? opponentId : user?.id);
                        if (winnerId) await concludeChallenge({ challengeId: challenge.id, winnerId });
                      }}
                    >
                      <Trophy className="w-4 h-4 mr-1" /> Kabul Et (Maçı Bitir)
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => disputeChallenge(challenge.id)}
                    >
                      ⚖️ İtiraz Et (Kanıt İste)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-foreground text-sm font-medium">Henüz mesaj yok</p>
                      <p className="text-muted-foreground text-xs mt-1">Rakibine sataşmaya başla! 🔥</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.user_id === user?.id;
                      let timeStr = "";
                      try {
                        timeStr = format(new Date(msg.created_at), "HH:mm", { locale: tr });
                      } catch { /* ignore */ }

                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary text-secondary-foreground rounded-bl-sm"
                          }`}>
                            {!isMe && (
                              <p className="text-[10px] font-medium opacity-70 mb-0.5">{msg.sender_name}</p>
                            )}
                            {msg.media_url && msg.media_type === "image" && (
                              <img src={msg.media_url} alt="Media" className="rounded-lg max-w-[200px] sm:max-w-[250px] mb-2 object-cover" loading="lazy" />
                            )}
                            {msg.media_url && msg.media_type === "video" && (
                              <video src={msg.media_url} controls className="rounded-lg max-w-[200px] sm:max-w-[250px] mb-2" />
                            )}
                            {msg.media_url && msg.media_type === "audio" && (
                              <div className="mb-1">
                                <CustomAudioPlayer src={msg.media_url} />
                              </div>
                            )}
                            {msg.message && <p className="text-sm">{msg.message}</p>}
                            <p className={`text-[9px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {timeStr}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* File preview strip */}
                {chatFile && (
                  <div className="px-3 pt-2 flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-secondary/80 rounded-lg px-3 py-1.5 text-xs text-foreground">
                      {chatFile.type.startsWith("video") ? <Video className="w-3.5 h-3.5 text-primary" /> : <ImageIcon className="w-3.5 h-3.5 text-primary" />}
                      <span className="truncate max-w-[180px]">{chatFile.name}</span>
                      <button onClick={() => setChatFile(null)} className="ml-1 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sticky input */}
                <div className="p-3 border-t border-border flex gap-2">
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setChatFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Button size="icon" variant="ghost" className="rounded-xl shrink-0" onClick={() => chatFileInputRef.current?.click()}>
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`rounded-xl shrink-0 ${isRecording ? "animate-pulse text-destructive" : ""}`}
                    onClick={async () => {
                      if (isRecording) {
                        const file = await stopRecording();
                        if (file.size > 0) {
                          setIsSendingChat(true);
                          try {
                            await sendMessage({ text: "🎵 Sesli Mesaj", file });
                          } finally {
                            setIsSendingChat(false);
                          }
                        }
                      } else {
                        startRecording();
                      }
                    }}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={isRecording ? `Kaydediliyor... (${recordingDuration}s)` : "Mesaj yaz..."}
                    disabled={isRecording}
                    className="flex-1 rounded-xl"
                  />
                  <Button size="icon" className="rounded-xl" onClick={handleSendMessage} disabled={isSendingChat || (!message.trim() && !chatFile)}>
                    {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            )}

            {/* Proof Tab */}
            {activeTab === "proof" && (() => {
              const myProofUrl = isChallenger ? challenge.proofUrl : challenge.opponentProofUrl;
              const theirProofUrl = isChallenger ? challenge.opponentProofUrl : challenge.proofUrl;

              const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await uploadProof(file, challenge.id, isChallenger);
                e.target.value = "";
              };

              const isVideo = (url: string) => /\.(mp4|mov|webm|avi)/i.test(url);

              return (
                <div className="space-y-5">
                  {/* My Proof */}
                  <div>
                    <p className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">Senin Kanıtın</p>
                    {!myProofUrl && challenge.status === "active" ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors group relative"
                      >
                        {isUploading ? (
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        ) : (
                          <UploadCloud className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                          {isUploading ? "Yükleniyor..." : "Buraya Tıkla (Görsel/Video)"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">JPG, PNG, MP4, MOV</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </button>
                    ) : myProofUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        {isVideo(myProofUrl) ? (
                          <video src={myProofUrl} controls className="w-full max-h-60 object-cover rounded-xl" />
                        ) : (
                          <img src={myProofUrl} alt="Kanıt" className="w-full max-h-60 object-cover" />
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Kanıt Yüklendi
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-xs">
                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Düello aktif değil
                      </div>
                    )}
                  </div>

                  {/* Opponent Proof */}
                  <div>
                    <p className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-2">
                      {opponentName || "Rakip"} Kanıtı
                    </p>
                    {theirProofUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        {isVideo(theirProofUrl) ? (
                          <video src={theirProofUrl} controls className="w-full max-h-60 object-cover rounded-xl" />
                        ) : (
                          <img src={theirProofUrl} alt="Rakip kanıt" className="w-full max-h-60 object-cover" />
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 backdrop-blur-xl bg-card border border-border rounded-xl">
                        <Camera className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                        <p className="text-muted-foreground text-xs">Rakip henüz kanıt yüklemedi</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* History Tab */}
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
                    const historyOpponentName = entry.challengerId === "current" ? entry.challengedName : entry.challengerName;

                    return (
                      <div key={entry.id} className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-medium">{won ? "Kazandın 🏆" : "Kaybettin"}</p>
                          <p className="text-muted-foreground text-xs">
                            vs {historyOpponentName} {dateStr && `• ${dateStr}`}
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
