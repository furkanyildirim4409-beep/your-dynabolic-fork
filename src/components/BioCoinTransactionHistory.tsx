import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, Dumbbell, Trophy, ShoppingCart, Gift, X, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Coins; label: string; colorClass: string }> = {
  workout: { icon: Dumbbell, label: "Antrenman", colorClass: "text-green-400" },
  challenge: { icon: Trophy, label: "Challenge", colorClass: "text-yellow-400" },
  purchase: { icon: ShoppingCart, label: "Satın Alım", colorClass: "text-red-400" },
  bonus: { icon: Gift, label: "Bonus", colorClass: "text-blue-400" },
};

interface BioCoinTransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const BioCoinTransactionHistory = ({ isOpen, onClose }: BioCoinTransactionHistoryProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;
    setIsLoading(true);
    supabase
      .from("bio_coin_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setTransactions(data as Transaction[]);
        setIsLoading(false);
      });
  }, [isOpen, user]);

  const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] bg-background border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Bio-Coin Geçmişi</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="glass-card p-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-[10px] text-muted-foreground">Toplam Kazanılan</p>
                <p className="font-display text-sm text-green-400">+{totalEarned.toLocaleString()}</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-[10px] text-muted-foreground">Toplam Harcanan</p>
                <p className="font-display text-sm text-red-400">-{totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">Henüz işlem geçmişi yok</p>
                <p className="text-muted-foreground text-xs mt-1">Antrenman tamamlayarak Bio-Coin kazanın!</p>
              </div>
            ) : (
              transactions.map((tx, idx) => {
                const config = typeConfig[tx.type] || typeConfig.bonus;
                const Icon = config.icon;
                const isEarned = tx.amount > 0;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass-card p-3 flex items-center gap-3"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isEarned ? "bg-green-500/15" : "bg-red-500/15"}`}>
                      <Icon className={`w-4 h-4 ${config.colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-xs font-medium truncate">
                        {tx.description || config.label}
                      </p>
                      <p className="text-muted-foreground text-[10px]">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={`font-display text-sm ${isEarned ? "text-green-400" : "text-red-400"}`}>
                      {isEarned ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BioCoinTransactionHistory;
