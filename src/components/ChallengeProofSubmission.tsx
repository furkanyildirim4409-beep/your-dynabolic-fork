import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Video, X, Upload, Check, AlertTriangle, Shield, Eye, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProofType = "photo" | "video";
type VerificationStatus = "pending" | "verified" | "disputed" | "rejected";

interface Proof {
  id: string;
  type: ProofType;
  url: string;
  submittedAt: string;
  status: VerificationStatus;
  submittedBy: string;
}

interface ChallengeProofSubmissionProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId?: string;
  onSubmit?: (type: ProofType) => void;
}

const mockProofs: Proof[] = [
  { id: "1", type: "photo", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400", submittedAt: "14:30", status: "verified", submittedBy: "Ahmet" },
  { id: "2", type: "photo", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400", submittedAt: "15:45", status: "pending", submittedBy: "Mehmet" },
];

const ChallengeProofSubmission = ({ isOpen, onClose, challengeId, onSubmit }: ChallengeProofSubmissionProps) => {
  const [uploadPhase, setUploadPhase] = useState<"select" | "uploading" | "review">("select");
  const [selectedType, setSelectedType] = useState<ProofType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = (type: ProofType) => {
    setSelectedType(type);
    setUploadPhase("uploading");
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadPhase("review");
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "verified": return { label: "Doğrulandı", color: "bg-green-500/20 text-green-400", icon: Check };
      case "pending": return { label: "Bekliyor", color: "bg-yellow-500/20 text-yellow-400", icon: Eye };
      case "disputed": return { label: "İtiraz", color: "bg-red-500/20 text-red-400", icon: Flag };
      case "rejected": return { label: "Reddedildi", color: "bg-red-500/20 text-red-400", icon: X };
    }
  };

  if (!isOpen) return null;

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
          className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Kanıt Sistemi</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(85vh - 80px)" }}>
            {uploadPhase === "select" && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm text-center mb-4">Kanıt türünü seçin</p>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUpload("photo")}
                    className="backdrop-blur-xl bg-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-all"
                  >
                    <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-foreground text-sm font-medium">Fotoğraf</p>
                    <p className="text-muted-foreground text-xs mt-1">Anlık çekim</p>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUpload("video")}
                    className="backdrop-blur-xl bg-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-all"
                  >
                    <Video className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-foreground text-sm font-medium">Video</p>
                    <p className="text-muted-foreground text-xs mt-1">Maks. 30 saniye</p>
                  </motion.button>
                </div>

                <div className="mt-6">
                  <h3 className="text-foreground text-sm font-medium mb-3">Gönderilen Kanıtlar</h3>
                  <div className="space-y-2">
                    {mockProofs.map((proof) => {
                      const badge = getStatusBadge(proof.status);
                      const BadgeIcon = badge.icon;
                      return (
                        <div key={proof.id} className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <img src={proof.url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-medium">{proof.submittedBy}</p>
                            <p className="text-muted-foreground text-xs">{proof.type === "photo" ? "Fotoğraf" : "Video"} • {proof.submittedAt}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-secondary/50">
                  <p className="text-foreground text-sm font-medium mb-2">Doğrulama Aksiyonları</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-green-400 border-green-400/20">
                      <ThumbsUp className="w-3.5 h-3.5" /> Onayla
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-red-400 border-red-400/20">
                      <ThumbsDown className="w-3.5 h-3.5" /> Reddet
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-yellow-400 border-yellow-400/20">
                      <Flag className="w-3.5 h-3.5" /> İtiraz
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {uploadPhase === "uploading" && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary mx-auto mb-4"
                />
                <p className="text-foreground font-medium">Yükleniyor...</p>
                <div className="w-48 h-2 rounded-full bg-secondary mx-auto mt-3 overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="text-muted-foreground text-sm mt-2">%{uploadProgress}</p>
              </div>
            )}

            {uploadPhase === "review" && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="w-8 h-8 text-green-400" />
                </motion.div>
                <h3 className="text-foreground text-lg font-bold">Kanıt Gönderildi!</h3>
                <p className="text-muted-foreground text-sm mt-2">Rakibiniz kanıtınızı inceleyecek.</p>
                <Button onClick={() => { setUploadPhase("select"); onSubmit?.(selectedType!); }} className="mt-6">
                  Tamam
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChallengeProofSubmission;
