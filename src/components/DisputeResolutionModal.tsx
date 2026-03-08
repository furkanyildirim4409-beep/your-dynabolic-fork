import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scale, AlertTriangle, CheckCircle, Clock, Send, MessageCircle, Shield, FileText, ChevronRight, User, Gavel, ThumbsUp, ThumbsDown, Loader2, Upload, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";

export type DisputeStatus = "pending" | "under_review" | "resolved_approved" | "resolved_rejected";

export interface DisputeMessage { id: string; senderId: string; senderName: string; senderRole: "athlete" | "coach" | "admin"; message: string; timestamp: string; }

export interface Dispute {
  id: string; proofId: string; challengeId: string; challengeType: "pr" | "streak"; exercise?: string; proofUrl: string; proofType: "photo" | "video";
  weight?: number; originalRejectionReason: string; appealReason: string; status: DisputeStatus; submittedAt: string; reviewedAt?: string;
  reviewerId?: string; reviewerName?: string; reviewerRole?: "coach" | "admin"; resolution?: string; messages: DisputeMessage[];
}

interface DisputeResolutionModalProps {
  isOpen: boolean; onClose: () => void; dispute?: Dispute | null; proofId?: string; proofUrl?: string; proofType: "photo" | "video";
  weight?: number; rejectionReason?: string; challengeId?: string; challengeType?: "pr" | "streak"; exercise?: string;
  onSubmitAppeal?: (appealReason: string) => void; onSendMessage?: (disputeId: string, message: string) => void;
}

const mockReviewer = { id: "coach-serdar", name: "Koç Serdar", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop", role: "coach" as const };

const getStatusInfo = (status: DisputeStatus) => {
  switch (status) {
    case "pending": return { label: "İnceleme Bekliyor", color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30", icon: Clock };
    case "under_review": return { label: "İnceleniyor", color: "text-blue-400 bg-blue-500/20 border-blue-500/30", icon: Scale };
    case "resolved_approved": return { label: "Onaylandı", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30", icon: CheckCircle };
    case "resolved_rejected": return { label: "Reddedildi", color: "text-red-400 bg-red-500/20 border-red-500/30", icon: X };
  }
};

const DisputeResolutionModal = ({ isOpen, onClose, dispute, proofId, proofUrl, proofType, weight, rejectionReason, challengeId, challengeType, exercise, onSubmitAppeal, onSendMessage }: DisputeResolutionModalProps) => {
  const [appealReason, setAppealReason] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalEvidence, setAdditionalEvidence] = useState<string | null>(null);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);

  if (!isOpen) return null;

  const isNewDispute = !dispute;
  const statusInfo = dispute ? getStatusInfo(dispute.status) : null;
  const StatusIcon = statusInfo?.icon || Clock;

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim()) { toast({ title: "İtiraz sebebi gerekli", description: "Lütfen neden itiraz ettiğinizi açıklayın", variant: "destructive" }); return; }
    setIsSubmitting(true); hapticMedium();
    await new Promise(r => setTimeout(r, 1000));
    hapticSuccess(); toast({ title: "İtiraz gönderildi! ⚖️", description: "Koçunuz en kısa sürede inceleyecek" });
    onSubmitAppeal?.(appealReason); setAppealReason(""); setIsSubmitting(false); onClose();
  };

  const handleSendMessage = async () => { if (!newMessage.trim() || !dispute) return; hapticLight(); onSendMessage?.(dispute.id, newMessage.trim()); setNewMessage(""); };
  const formatDate = (timestamp: string) => new Date(timestamp).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-background rounded-t-3xl border-t border-white/10 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><Scale className="w-5 h-5 text-amber-400" /></div>
            <div>
              <h2 className="font-display text-base text-foreground">{isNewDispute ? "İtiraz Gönder" : "İtiraz Detayı"}</h2>
              <p className="text-muted-foreground text-xs">{isNewDispute ? "Reddedilen kanıtınız için itiraz edin" : `#${dispute?.id.slice(0, 8)}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusInfo && (
              <div className={`px-2 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1 ${statusInfo.color}`}>
                <StatusIcon className="w-3 h-3" />{statusInfo.label}
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-full bg-white/5"><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Proof Preview */}
            <div className="glass-card p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="w-3 h-3" />Reddedilen Kanıt</div>
                <span className="text-[10px] text-muted-foreground">Büyütmek için dokun</span>
              </div>
              <button onClick={() => { hapticLight(); setShowFullscreenImage(true); }} className="relative w-full h-32 rounded-xl overflow-hidden bg-secondary group cursor-pointer">
                {(dispute?.proofType || proofType) === "photo" ? (
                  <img src={dispute?.proofUrl || proofUrl} alt="Proof" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <video src={dispute?.proofUrl || proofUrl} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="w-5 h-5 text-white" /></div>
                </div>
                {(dispute?.weight || weight) && <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-primary/80 backdrop-blur-sm"><span className="text-primary-foreground text-xs font-display">{dispute?.weight || weight}kg</span></div>}
                <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"><ZoomIn className="w-3 h-3 text-white" /></div>
              </button>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400 text-xs mb-1"><AlertTriangle className="w-3 h-3" />Red Sebebi</div>
                <p className="text-foreground text-sm">{dispute?.originalRejectionReason || rejectionReason}</p>
              </div>
            </div>

            {/* New Dispute Form */}
            {isNewDispute && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-foreground text-sm font-medium flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" />İtiraz Sebebiniz</label>
                  <Textarea value={appealReason} onChange={e => setAppealReason(e.target.value)} placeholder="Kanıtınızın neden geçerli olduğunu açıklayın..." className="bg-secondary border-white/10 min-h-[120px]" />
                  <p className="text-muted-foreground text-[10px]">Koçunuz itirazınızı inceleyecek ve karar verecek</p>
                </div>
                <div className="space-y-2">
                  <label className="text-foreground text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4 text-primary" />Ek Kanıt (Opsiyonel)</label>
                  <button onClick={() => { hapticLight(); setAdditionalEvidence("evidence"); toast({ title: "Ek kanıt eklendi" }); }}
                    className="w-full glass-card p-4 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                    <Upload className="w-5 h-5" /><span className="text-sm">Farklı açıdan fotoğraf veya video yükle</span>
                  </button>
                  {additionalEvidence && <div className="flex items-center gap-2 text-emerald-400 text-xs"><CheckCircle className="w-3 h-3" />Ek kanıt eklendi</div>}
                </div>
                <Button onClick={handleSubmitAppeal} disabled={!appealReason.trim() || isSubmitting} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scale className="w-4 h-4 mr-2" />}
                  {isSubmitting ? "Gönderiliyor..." : "İtiraz Gönder"}
                </Button>
              </div>
            )}

            {/* Existing Dispute */}
            {dispute && (
              <>
                <div className="glass-card p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><MessageCircle className="w-3 h-3" />Senin İtirazın</div>
                  <p className="text-foreground text-sm">{dispute.appealReason}</p>
                </div>
                {dispute.reviewerId && (
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-primary"><AvatarImage src={mockReviewer.avatar} className="object-cover" /><AvatarFallback className="bg-primary/20 text-primary">KS</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-foreground text-sm font-medium">{dispute.reviewerName}</p>
                          <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-medium">{dispute.reviewerRole === "admin" ? "Admin" : "Koç"}</span>
                        </div>
                        <p className="text-muted-foreground text-[10px]">{dispute.status === "under_review" ? "İnceleniyor..." : `Karar verildi: ${formatDate(dispute.reviewedAt!)}`}</p>
                      </div>
                      {dispute.status.startsWith("resolved") && (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dispute.status === "resolved_approved" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                          {dispute.status === "resolved_approved" ? <ThumbsUp className="w-5 h-5 text-emerald-400" /> : <ThumbsDown className="w-5 h-5 text-red-400" />}
                        </div>
                      )}
                    </div>
                    {dispute.resolution && (
                      <div className={`mt-3 p-3 rounded-xl ${dispute.status === "resolved_approved" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                        <div className={`flex items-center gap-2 text-xs mb-1 ${dispute.status === "resolved_approved" ? "text-emerald-400" : "text-red-400"}`}><Gavel className="w-3 h-3" />Karar</div>
                        <p className="text-foreground text-sm">{dispute.resolution}</p>
                      </div>
                    )}
                  </div>
                )}
                {dispute.messages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageCircle className="w-3 h-3" />Mesajlar</div>
                    <div className="space-y-2">
                      {dispute.messages.map((msg, index) => (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                          className={`p-3 rounded-xl ${msg.senderId === "current" ? "bg-primary/10 border border-primary/20 ml-6" : msg.senderRole === "coach" || msg.senderRole === "admin" ? "bg-amber-500/10 border border-amber-500/20 mr-6" : "bg-secondary mr-6"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${msg.senderId === "current" ? "text-primary" : msg.senderRole === "coach" || msg.senderRole === "admin" ? "text-amber-400" : "text-foreground"}`}>{msg.senderName}</span>
                            {msg.senderRole !== "athlete" && <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px]">{msg.senderRole === "admin" ? "Admin" : "Koç"}</span>}
                            <span className="text-muted-foreground text-[10px] ml-auto">{formatDate(msg.timestamp)}</span>
                          </div>
                          <p className="text-foreground text-sm">{msg.message}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {!dispute.status.startsWith("resolved") && (
                  <div className="flex gap-2">
                    <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Mesaj yaz..." className="bg-secondary border-white/10 min-h-[60px] flex-1" />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" className="self-end"><Send className="w-4 h-4" /></Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </motion.div>

      <Dialog open={showFullscreenImage} onOpenChange={setShowFullscreenImage}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-white/10">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button onClick={() => setShowFullscreenImage(false)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
            {(dispute?.proofType || proofType) === "photo" ? (
              <img src={dispute?.proofUrl || proofUrl} alt="Proof" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            ) : (
              <video src={dispute?.proofUrl || proofUrl} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            )}
            {(dispute?.weight || weight) && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary/80 backdrop-blur-sm"><span className="text-primary-foreground text-lg font-display">{dispute?.weight || weight}kg</span></div>}
          </div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
};

export default DisputeResolutionModal;
