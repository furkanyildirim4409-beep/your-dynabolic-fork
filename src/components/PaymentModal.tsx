import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Building2, Copy, Check, Shield, Loader2, ShoppingBag, Package, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export type PaymentType = "invoice" | "store" | "coaching" | "supplement";

export interface PaymentDetails {
  amount: number;
  title: string;
  description?: string;
  type: PaymentType;
  referenceId?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDetails | null;
  onPaymentSuccess: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(amount);
};

const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];
  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }
  return parts.length ? parts.join(" ") : value;
};

const formatExpiry = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  if (v.length >= 2) return v.substring(0, 2) + "/" + v.substring(2, 4);
  return v;
};

const getTypeIcon = (type: PaymentType) => {
  switch (type) {
    case "store": case "supplement": return <ShoppingBag className="w-4 h-4" />;
    case "coaching": return <User className="w-4 h-4" />;
    default: return <Package className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: PaymentType) => {
  switch (type) {
    case "store": return "Mağaza Alışverişi";
    case "supplement": return "Supplement Siparişi";
    case "coaching": return "Koçluk Paketi";
    default: return "Fatura Ödemesi";
  }
};

const PaymentModal = ({ isOpen, onClose, payment, onPaymentSuccess }: PaymentModalProps) => {
  const [activeTab, setActiveTab] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const generateReferenceCode = () => {
    const prefix = payment?.type === "coaching" ? "COACH" : payment?.type === "supplement" ? "SUP" : payment?.type === "store" ? "SHOP" : "DYN";
    return `${prefix}-${payment?.referenceId || Date.now()}-${new Date().getFullYear()}`;
  };

  const bankDetails = {
    bankName: "DYNABOLIC A.Ş.",
    iban: "TR12 3456 7890 1234 5678 9012 34",
    referenceCode: generateReferenceCode(),
  };

  const handleCopy = (field: string, value: string) => {
    navigator.clipboard.writeText(value.replace(/\s/g, ""));
    setCopiedField(field);
    toast({ title: "Kopyalandı ✓", description: `${field} panoya kopyalandı.` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayment = () => {
    if (!payment) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
      onClose();
      setCardNumber(""); setExpiry(""); setCvv(""); setCardName("");
    }, 2000);
  };

  const isCardFormValid = cardNumber.length >= 19 && expiry.length === 5 && cvv.length >= 3 && cardName.length >= 2;

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-white/10 text-foreground max-w-md p-0 overflow-hidden z-[9999]">
        <DialogHeader className="p-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-green-500" />
            <DialogTitle className="text-sm font-display uppercase tracking-wider text-foreground">GÜVENLİ ÖDEME</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">{getTypeIcon(payment.type)}</div>
              <div>
                <p className="text-sm text-foreground font-medium">{payment.title}</p>
                <p className="text-xs text-muted-foreground">{getTypeLabel(payment.type)}</p>
              </div>
            </div>
            <p className="font-display text-2xl text-foreground font-bold">{formatCurrency(payment.amount)}</p>
          </div>
          {payment.description && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/5">{payment.description}</p>}
        </div>

        <div className="p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 bg-white/[0.03] border border-white/5 p-1 h-12 mb-5">
              <TabsTrigger value="card" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium gap-2">
                <CreditCard className="w-4 h-4" />KART
              </TabsTrigger>
              <TabsTrigger value="transfer" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium gap-2">
                <Building2 className="w-4 h-4" />HAVALE
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Kart Numarası</label>
                  <Input type="text" placeholder="•••• •••• •••• ••••" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} className="bg-black/40 border-white/10 text-foreground text-lg tracking-widest h-12 font-mono" autoComplete="off" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Son Kullanma</label>
                    <Input type="text" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} maxLength={5} className="bg-black/40 border-white/10 text-foreground h-12 font-mono tracking-widest" autoComplete="off" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">CVV</label>
                    <Input type="password" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))} maxLength={4} className="bg-black/40 border-white/10 text-foreground h-12 font-mono tracking-widest" autoComplete="off" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Kart Sahibinin Adı</label>
                  <Input type="text" placeholder="AD SOYAD" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="bg-black/40 border-white/10 text-foreground h-12 uppercase tracking-wide" autoComplete="off" />
                </div>
                <Button onClick={handlePayment} disabled={!isCardFormValid || isProcessing} className="w-full h-14 bg-primary text-primary-foreground font-display text-lg tracking-wider hover:bg-primary/90 disabled:opacity-50 mt-2">
                  <AnimatePresence mode="wait">
                    {isProcessing ? (
                      <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />İŞLENİYOR...
                      </motion.div>
                    ) : (
                      <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />{formatCurrency(payment.amount)} ÖDE
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">256-bit SSL şifreleme ile korunur</span>
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span className="font-display text-sm uppercase tracking-wider">HAVALE BİLGİLERİ</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hesap Sahibi</p>
                    <p className="text-foreground font-medium">{bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">IBAN</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-foreground font-mono text-sm">{bankDetails.iban}</p>
                      <button onClick={() => handleCopy("IBAN", bankDetails.iban)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs">
                        {copiedField === "IBAN" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-muted-foreground">Kopyala</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Referans Kodu</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-primary font-mono font-bold">{bankDetails.referenceCode}</p>
                      <button onClick={() => handleCopy("Referans", bankDetails.referenceCode)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs">
                        {copiedField === "Referans" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-muted-foreground">Kopyala</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 text-lg">⚠️</span>
                  <p className="text-sm text-amber-200/80">Havale yaparken <span className="font-bold text-amber-200">referans kodunu</span> açıklama alanına eklemeyi unutmayın.</p>
                </div>
                <div className="text-center py-4 border-t border-white/5">
                  <p className="text-sm text-muted-foreground">Aktarılacak Tutar</p>
                  <p className="font-display text-3xl text-foreground font-bold mt-1">{formatCurrency(payment.amount)}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
