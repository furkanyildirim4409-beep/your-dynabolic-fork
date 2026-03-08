import { motion, AnimatePresence } from "framer-motion";
import { Coins, X, Gift, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { currentUser } from "@/lib/mockData";

const BioCoinWallet = ({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void; balance?: number; showLabel?: boolean }) => {
  if (isOpen === undefined) {
    // Inline badge mode
    return (
      <div className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-full border border-primary/30">
        <Coins className="w-4 h-4 text-primary" />
        <span className="font-display text-sm text-primary">{currentUser.bioCoins.toLocaleString()}</span>
      </div>
    );
  }

  // Modal mode
  const transactions = [
    { id: "1", type: "earn", label: "Antrenman tamamlandı", amount: 75, date: "Bugün" },
    { id: "2", type: "earn", label: "7 gün serisi bonusu", amount: 150, date: "Dün" },
    { id: "3", type: "spend", label: "E-Kitap satın alımı", amount: -500, date: "3 gün önce" },
    { id: "4", type: "earn", label: "Challenge kazandı", amount: 200, date: "5 gün önce" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-background border-t border-white/10 rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg text-foreground">BIO-COIN CÜZDAN</h2>
                <button onClick={onClose} className="p-2 text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="glass-card-premium p-6 text-center mb-6">
                <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-display text-3xl text-foreground">{currentUser.bioCoins.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs">Bio-Coin bakiyeniz</p>
              </div>
              <h3 className="text-muted-foreground text-xs uppercase tracking-widest mb-3">Son İşlemler</h3>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="glass-card p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "earn" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {t.type === "earn" ? <ArrowDownLeft className="w-4 h-4 text-green-400" /> : <ArrowUpRight className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm">{t.label}</p>
                      <p className="text-muted-foreground text-[10px]">{t.date}</p>
                    </div>
                    <span className={`font-display text-sm ${t.amount > 0 ? "text-green-400" : "text-red-400"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BioCoinWallet;
