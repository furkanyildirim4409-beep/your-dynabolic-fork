import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Dumbbell, Leaf, Globe, User, Plus, Droplets, Scale, MessageSquare, BookOpen, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWeightTracking } from "@/hooks/useWeightTracking";
import { useAuth } from "@/context/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const navItems = [
  { id: "kokpit", label: "Kokpit", icon: <LayoutGrid className="w-6 h-6" />, path: "/kokpit" },
  { id: "antrenman", label: "Antrenman", icon: <Dumbbell className="w-6 h-6" />, path: "/antrenman" },
  { id: "beslenme", label: "Beslenme", icon: <Leaf className="w-6 h-6" />, path: "/beslenme" },
  { id: "kesfet", label: "Keşfet", icon: <Globe className="w-6 h-6" />, path: "/kesfet" },
  { id: "profil", label: "Profil", icon: <User className="w-6 h-6" />, path: "/profil" },
];

const EliteDock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { logWeight } = useWeightTracking();
  const { unreadCount } = useUnreadMessages();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [weight, setWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWaterAmount, setSelectedWaterAmount] = useState<number | null>(null);
  const waterOptions = [150, 200, 250, 300, 500];

  const currentPath = location.pathname === "/" ? "/kokpit" : location.pathname;

  const handleOpenWeight = () => {
    setWeight(String(profile?.current_weight ?? ""));
    setShowWeightModal(true);
    setIsFabOpen(false);
  };

  const handleSaveWeight = async () => {
    const kg = Number(weight);
    if (isNaN(kg) || kg <= 0) {
      toast({ title: "Geçersiz değer", description: "Lütfen geçerli bir ağırlık girin.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const result = await logWeight(kg);
    setIsSaving(false);
    if (result?.error) {
      toast({ title: "Hata", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Ağırlık Kaydedildi ⚖️", description: `Güncel ağırlığın: ${kg} kg` });
      setShowWeightModal(false);
    }
  };

  const fabActions = [
    { id: "water", label: "Su Ekle", icon: <Droplets className="w-5 h-5" />, onClick: () => { setShowWaterModal(true); setIsFabOpen(false); } },
    { id: "weight", label: "Ağırlık Gir", icon: <Scale className="w-5 h-5" />, onClick: handleOpenWeight },
    { id: "coach", label: unreadCount > 0 ? `Koça Raporla (${unreadCount})` : "Koça Raporla", icon: <div className="relative"><MessageSquare className="w-5 h-5" />{unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive" />}</div>, onClick: () => { setIsFabOpen(false); if (location.pathname !== "/kokpit") navigate("/kokpit"); setTimeout(() => window.dispatchEvent(new CustomEvent('openCoachChat')), 150); } },
    { id: "payments", label: "Ödemeler", icon: <CreditCard className="w-5 h-5" />, onClick: () => { navigate("/odemeler"); setIsFabOpen(false); } },
    { id: "academy", label: "Akademi", icon: <BookOpen className="w-5 h-5" />, onClick: () => { navigate("/akademi"); setIsFabOpen(false); } },
  ];

  return (
    <>
      <motion.div initial={{ y: 100, opacity: 0, x: "-50%" }} animate={{ y: 0, opacity: 1, x: "-50%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} className="fixed left-1/2 z-[40] flex items-center gap-4 w-max pointer-events-none" style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <nav className="pointer-events-auto relative bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-full px-4 h-[68px] flex items-center gap-1 shadow-2xl shadow-black/50 overflow-hidden isolate">
          <LayoutGroup id="dock-nav">
            {navItems.map((item) => {
              const isActive = currentPath === item.path;
              const showBadge = item.id === "kokpit" && unreadCount > 0;
              return (
                <button key={item.id} onClick={() => navigate(item.path)} className={cn("relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200", isActive ? "text-[#ccff00]" : "text-zinc-400 hover:text-zinc-100")}>
                  {isActive && <motion.div layoutId="active-bubble" className="absolute inset-0 bg-white/10 rounded-full z-[-1]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <motion.div animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>{item.icon}</motion.div>
                  {showBadge && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </LayoutGroup>
        </nav>
        <div className="relative pointer-events-auto">
          <AnimatePresence mode="wait">
            {isFabOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]" onClick={() => setIsFabOpen(false)} />
                <motion.div className="absolute bottom-24 right-0 flex flex-col gap-3 items-end min-w-[180px] z-20">
                  {fabActions.map((action, index) => (
                    <motion.button key={action.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: (fabActions.length - 1 - index) * 0.03, type: "spring", stiffness: 450, damping: 25 }} onClick={action.onClick} className="group flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-full shadow-xl hover:bg-zinc-900 transition-colors">
                      <span className="text-white text-sm font-medium group-hover:text-[#ccff00] transition-colors">{action.label}</span>
                      <span className="text-[#ccff00] bg-white/5 p-1.5 rounded-full">{action.icon}</span>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsFabOpen(!isFabOpen)} className={cn("relative z-30 h-[68px] w-[68px] rounded-full flex items-center justify-center shadow-lg transition-colors", isFabOpen ? "bg-zinc-800 text-white border border-white/10" : "bg-[#ccff00] text-black shadow-[#ccff00]/40")}>
            <motion.div animate={{ rotate: isFabOpen ? 135 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}><Plus size={32} strokeWidth={2.5} /></motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Weight Modal - Connected to Supabase */}
      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-sm z-[100]">
          <DialogHeader><DialogTitle className="text-white">AĞIRLIK GİRİŞİ</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <Scale className="w-12 h-12 mx-auto text-[#ccff00] mb-4" />
              <p className="text-zinc-400 text-sm">Güncel ağırlığını gir</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="text-center text-3xl h-16 bg-zinc-800 border-white/10 text-white font-bold w-32" />
              <span className="text-xl text-zinc-400">kg</span>
            </div>
            <Button onClick={handleSaveWeight} disabled={isSaving} className="w-full bg-[#ccff00] text-black hover:bg-[#b3e600] font-bold">
              {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> KAYDEDİLİYOR...</> : "KAYDET"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Water Modal */}
      <Dialog open={showWaterModal} onOpenChange={setShowWaterModal}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-sm z-[100]">
          <DialogHeader><DialogTitle className="text-white">SU EKLE 💧</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm text-center">Kaç ml su içtin?</p>
            <div className="grid grid-cols-3 gap-2">
              {waterOptions.map((amount) => (<button key={amount} onClick={() => setSelectedWaterAmount(amount)} className={cn("p-3 rounded-xl border text-center transition-all", selectedWaterAmount === amount ? "bg-[#ccff00]/20 border-[#ccff00] text-[#ccff00]" : "bg-zinc-800 border-white/10 text-white hover:border-white/30")}><span className="font-display text-lg">{amount}</span><span className="text-xs text-zinc-400 ml-0.5">ml</span></button>))}
            </div>
            <Button onClick={() => { if (selectedWaterAmount) { toast({ title: `${selectedWaterAmount}ml Su Eklendi 💧` }); setShowWaterModal(false); setSelectedWaterAmount(null); } }} disabled={!selectedWaterAmount} className="w-full bg-[#ccff00] text-black hover:bg-[#b3e600] font-bold disabled:opacity-50">EKLE</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EliteDock;
