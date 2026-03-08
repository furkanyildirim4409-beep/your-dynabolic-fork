import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Receipt, CheckCircle2, CreditCard } from "lucide-react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/types/shared-models";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(amount);
};

const PaymentReceiptModal = ({ isOpen, onClose, invoice }: PaymentReceiptModalProps) => {
  if (!invoice) return null;

  const handleDownload = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 30;

    doc.setFillColor(205, 220, 57);
    doc.rect(0, 0, pageWidth, 45, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("DYNABOLIC", pageWidth / 2, 22, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("ÖDEME MAKBUZU", pageWidth / 2, 35, { align: "center" });

    yPos = 60;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Makbuz No: RCP-${invoice.id}`, margin, yPos);
    doc.text(`Tarih: ${formatDate(invoice.date)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("HİZMET DETAYLARI", margin, yPos);
    yPos += 10;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 3, 3, "F");
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Hizmet:", margin + 5, yPos);
    doc.setTextColor(50, 50, 50);
    doc.text(invoice.serviceType || "Hizmet", margin + 30, yPos);
    yPos += 10;
    doc.setTextColor(100, 100, 100);
    doc.text("Durum:", margin + 5, yPos);
    doc.setTextColor(76, 175, 80);
    doc.text("✓ ÖDENDİ", margin + 30, yPos);
    yPos += 20;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ÖDEME BİLGİLERİ", margin, yPos);
    yPos += 10;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, "F");
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Ödeme Yöntemi:", margin + 5, yPos);
    doc.setTextColor(50, 50, 50);
    doc.text("Kredi Kartı", margin + 45, yPos);
    yPos += 10;
    doc.setTextColor(100, 100, 100);
    doc.text("İşlem ID:", margin + 5, yPos);
    doc.setTextColor(50, 50, 50);
    doc.text(`TXN-${Date.now().toString(36).toUpperCase()}`, margin + 45, yPos);
    yPos += 10;
    doc.setTextColor(100, 100, 100);
    doc.text("İşlem Tarihi:", margin + 5, yPos);
    doc.setTextColor(50, 50, 50);
    doc.text(formatDate(invoice.date), margin + 45, yPos);
    yPos += 25;

    doc.setFillColor(205, 220, 57);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, "F");
    yPos += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("TOPLAM TUTAR", margin + 10, yPos);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(invoice.amount), pageWidth - margin - 10, yPos + 5, { align: "right" });

    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Dynabolic Fitness", pageWidth / 2, footerY, { align: "center" });
    doc.text("www.dynabolic.app | info@dynabolic.app", pageWidth / 2, footerY + 5, { align: "center" });
    doc.text("Bu belge elektronik olarak oluşturulmuştur.", pageWidth / 2, footerY + 10, { align: "center" });

    doc.save(`dynabolic-makbuz-${invoice.id}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-background border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center"><Receipt className="w-4 h-4 text-green-400" /></div>
                <h2 className="font-display text-lg text-foreground">MAKBUZ</h2>
              </div>
              <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-green-400" /></div>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-display text-sm tracking-wider">ÖDEME TAMAMLANDI</p>
                <p className="text-foreground font-display text-2xl mt-1">{formatCurrency(invoice.amount)}</p>
              </div>

              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between"><span className="text-muted-foreground text-sm">Hizmet</span><span className="text-foreground text-sm font-medium">{invoice.serviceType}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground text-sm">Makbuz No</span><span className="text-foreground text-sm font-mono">RCP-{invoice.id}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground text-sm">Tarih</span><span className="text-foreground text-sm">{formatDate(invoice.date)}</span></div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Ödeme Yöntemi</span>
                  <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-foreground text-sm">Kredi Kartı</span></div>
                </div>
              </div>

              <Button onClick={handleDownload} className="w-full bg-primary/20 text-primary hover:bg-primary/30 font-display tracking-wider">
                <Download className="w-4 h-4 mr-2" />MAKBUZU İNDİR
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentReceiptModal;
