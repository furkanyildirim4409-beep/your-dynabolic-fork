import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, ChevronRight, Download } from "lucide-react";
import { invoices } from "@/lib/mockData";

const Odemeler = () => {
  const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    paid: { label: "Ödendi", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
    pending: { label: "Bekliyor", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    overdue: { label: "Gecikmiş", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/20" },
  };

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">ÖDEMELER</h1>
        </div>
        <p className="text-muted-foreground text-xs">Fatura ve ödeme geçmişi</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Toplam", value: "₺3,300", color: "text-foreground" },
          { label: "Ödenen", value: "₺1,500", color: "text-green-400" },
          { label: "Bekleyen", value: "₺1,800", color: "text-yellow-400" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-3 text-center">
            <p className={`font-display text-lg ${s.color}`}>{s.value}</p>
            <p className="text-muted-foreground text-[10px]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.map((inv, i) => {
          const config = statusConfig[inv.status];
          const Icon = config.icon;
          return (
            <motion.div key={inv.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground text-sm font-medium">{inv.serviceType}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} flex items-center gap-1`}>
                  <Icon className="w-3 h-3" />{config.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">{inv.date}</p>
                  {inv.dueDate && <p className="text-muted-foreground text-[10px]">Son: {inv.dueDate}</p>}
                </div>
                <p className="font-display text-lg text-foreground">₺{inv.amount.toLocaleString()}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Odemeler;
