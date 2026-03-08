import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Droplets, Scale, MessageSquare, GraduationCap, ChefHat, CreditCard, User, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWeightTracking } from "@/hooks/useWeightTracking";
import { useAuth } from "@/context/AuthContext";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface QuickActionFABProps {
  onOpenChat?: () => void;
}

const QuickActionFAB = ({ onOpenChat }: QuickActionFABProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { logWeight, isLoading: weightLoading } = useWeightTracking();
  const [isOpen, setIsOpen] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [waterCount, setWaterCount] = useState(0);

  const handleAddWater = () => {
    const newCount = waterCount + 1;
    setWaterCount(newCount);
    toast({
      title: "250ml Su Eklendi 💧",
      description: `Bugün ${newCount * 250}ml su içtin!`,
    });
    setIsOpen(false);
  };

  const handleLogWeight = () => {
    setWeight(String(profile?.current_weight ?? 78.5));
    setShowWeightModal(true);
    setIsOpen(false);
  };

  const handleSaveWeight = async () => {
    const kg = parseFloat(weight);
    if (isNaN(kg) || kg <= 0) return;
    setIsSaving(true);
    const result = await logWeight(kg);
    setIsSaving(false);
    if (result?.error) {
      toast({ title: "Hata", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Kilo kaydı başarıyla eklendi! ⚖️", description: `Güncel ağırlığın: ${kg} kg` });
      setShowWeightModal(false);
    }
  };

  const handleReportToCoach = () => {
    if (onOpenChat) {
      onOpenChat();
    }
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const actions: QuickAction[] = [
    { id: "water", label: "Su Ekle", icon: <Droplets className="w-5 h-5" />, onClick: handleAddWater },
    { id: "weight", label: "Ağırlık Gir", icon: <Scale className="w-5 h-5" />, onClick: handleLogWeight },
    { id: "coach", label: "Koça Raporla", icon: <MessageSquare className="w-5 h-5" />, onClick: handleReportToCoach },
    { id: "akademi", label: "Akademi", icon: <GraduationCap className="w-5 h-5" />, onClick: () => handleNavigate("/akademi") },
    { id: "tarifler", label: "Tarifler", icon: <ChefHat className="w-5 h-5" />, onClick: () => handleNavigate("/tarifler") },
    { id: "odemeler", label: "Ödemeler", icon: <CreditCard className="w-5 h-5" />, onClick: () => handleNavigate("/odemeler") },
    { id: "hizmetler", label: "Koçluk Paketleri", icon: <User className="w-5 h-5" />, onClick: () => handleNavigate("/hizmetler") },
  ];

  const playClickSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.08);
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: QuickAction) => {
    playClickSound();
    action.onClick();
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40">
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/60 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-16 right-0 flex flex-col-reverse gap-3"
              >
                {actions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleAction(action)}
                    className="flex items-center gap-3 px-4 py-3 bg-secondary/90 backdrop-blur-xl rounded-xl border border-white/10 hover:bg-secondary transition-colors"
                  >
                    <span className="text-primary">{action.icon}</span>
                    <span className="text-foreground text-sm font-medium whitespace-nowrap">{action.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isOpen ? "bg-muted border border-border" : "bg-primary neon-glow"
          }`}
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {isOpen ? <X className="w-6 h-6 text-foreground" /> : <Plus className="w-6 h-6 text-primary-foreground" />}
          </motion.div>
          {!isOpen && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.button>

        {!isOpen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -left-24 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap"
          >
            HIZLI BAŞLAT
          </motion.p>
        )}
      </div>

      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent className="bg-background border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg text-foreground">AĞIRLIK GİRİŞİ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <Scale className="w-12 h-12 mx-auto text-primary mb-4" />
              <p className="text-muted-foreground text-sm">Güncel ağırlığını gir</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-center text-2xl font-display bg-secondary/50 border-white/10 h-16"
              />
              <span className="text-foreground font-display text-xl">kg</span>
            </div>
            <Button onClick={handleSaveWeight} disabled={isSaving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> KAYDEDİLİYOR...</> : "KAYDET"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActionFAB;
