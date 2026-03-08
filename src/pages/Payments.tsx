import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Calendar, AlertCircle, CheckCircle2, Clock, Receipt, Download, History, Package, Coins } from "lucide-react";
import confetti from "canvas-confetti";
import { invoices as initialInvoices } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import PaymentModal, { PaymentDetails } from "@/components/PaymentModal";
import PaymentReceiptModal from "@/components/PaymentReceiptModal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Invoice } from "@/types/shared-models";

const statusConfig = {
  paid: { label: "Ödendi", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  pending: { label: "Bekliyor", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  overdue: { label: "Gecikmiş", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
};

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const formatCurrency = (amount: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(amount);

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Hazırlanıyor", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  shipped: { label: "Kargolandı", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  delivered: { label: "Teslim Edildi", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "İptal", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

interface OrderItem {
  id?: string;
  title?: string;
  price?: number;
  quantity?: number;
}

const getOrderSummary = (items: unknown): string => {
  const arr = Array.isArray(items) ? items as OrderItem[] : [];
  if (arr.length === 0) return "Sipariş";
  const first = arr[0]?.title || "Ürün";
  if (arr.length === 1) return first;
  return `${first} ve ${arr.length - 1} diğer ürün`;
};

const fireConfetti = () => {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
  const fire = (particleRatio: number, opts: confetti.Options) => confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.2, { spread: 60, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
};

const Payments = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) { setOrdersLoading(false); return; }
    const fetchOrders = async () => {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setOrders(data);
      setOrdersLoading(false);
    };
    fetchOrders();
  }, [user]);
  const [selectedReceipt, setSelectedReceipt] = useState<Invoice | null>(null);

  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const pendingInvoices = invoices.filter((inv) => inv.status === "pending" || inv.status === "overdue");
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const nextDueInvoice = pendingInvoices.filter((inv) => inv.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

  const handlePayClick = (invoice: Invoice) => { setSelectedInvoice(invoice); setShowPaymentModal(true); };
  const handleViewReceipt = (invoice: Invoice) => { setSelectedReceipt(invoice); setShowReceiptModal(true); };

  const getPaymentDetails = (): PaymentDetails | null => {
    if (!selectedInvoice) return null;
    return { amount: selectedInvoice.amount, title: `Fatura #${selectedInvoice.id}`, description: selectedInvoice.serviceType, type: "invoice", referenceId: selectedInvoice.id };
  };

  const handlePaymentSuccess = () => {
    if (!selectedInvoice) return;
    setInvoices((current) => current.map((inv) => inv.id === selectedInvoice.id ? { ...inv, status: "paid" as const } : inv));
    setTimeout(() => fireConfetti(), 100);
    toast({ title: "Ödeme Başarılı! 🎉", description: "Faturanız başarıyla ödendi." });
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl text-foreground">ÖDEMELER</h1>
        <p className="text-muted-foreground text-sm">Fatura ve ödeme geçmişi</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Bekleyen Toplam</p>
            <p className="font-display text-3xl text-foreground mt-1">{formatCurrency(totalPending)}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/20"><CreditCard className="w-6 h-6 text-primary" /></div>
        </div>
        {nextDueInvoice && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sonraki son ödeme: <span className="text-foreground">{formatDate(nextDueInvoice.dueDate!)}</span></span>
          </div>
        )}
      </motion.div>

      {pendingInvoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg text-foreground flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" />BEKLEYEN FATURALAR</h2>
          {pendingInvoices.map((invoice, index) => {
            const status = statusConfig[invoice.status];
            const StatusIcon = status.icon;
            return (
              <motion.div key={invoice.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.05 }} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{invoice.serviceType || "Hizmet"}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${status.className} flex items-center gap-1`}><StatusIcon className="w-3 h-3" />{status.label}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{formatDate(invoice.date)}</p>
                    {invoice.dueDate && <p className="text-muted-foreground text-xs mt-1">Son ödeme: {formatDate(invoice.dueDate)}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-display text-lg ${invoice.status === "overdue" ? "text-red-400" : "text-foreground"}`}>{formatCurrency(invoice.amount)}</p>
                    <Button size="sm" onClick={() => handlePayClick(invoice)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-xs tracking-wider h-8 px-4">ÖDE</Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg text-foreground flex items-center gap-2"><History className="w-4 h-4 text-green-400" />ÖDEME GEÇMİŞİ</h2>
        {paidInvoices.length === 0 ? (
          <div className="glass-card p-6 text-center"><Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground text-sm">Henüz tamamlanmış ödeme yok</p></div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
                  <div><p className="text-muted-foreground text-xs">Toplam Ödenen</p><p className="font-display text-xl text-foreground">{formatCurrency(totalPaid)}</p></div>
                </div>
                <p className="text-muted-foreground text-sm">{paidInvoices.length} işlem</p>
              </div>
            </motion.div>
            {paidInvoices.map((invoice, index) => (
              <motion.div key={invoice.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{invoice.serviceType || "Hizmet"}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs border bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Ödendi</span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{formatDate(invoice.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-display text-lg text-foreground">{formatCurrency(invoice.amount)}</p>
                    <Button size="sm" variant="ghost" onClick={() => handleViewReceipt(invoice)} className="text-muted-foreground hover:text-foreground h-8 px-3"><Receipt className="w-4 h-4 mr-1" />Makbuz</Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} payment={getPaymentDetails()} onPaymentSuccess={handlePaymentSuccess} />
      <PaymentReceiptModal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} invoice={selectedReceipt} />
    </div>
  );
};

export default Payments;
