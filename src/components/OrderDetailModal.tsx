import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Coins, Hash } from "lucide-react";

interface OrderItem {
  id?: string;
  title?: string;
  price?: number;
  quantity?: number;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    items: unknown;
    total_price: number;
    total_coins_used: number | null;
    status: string | null;
    created_at: string | null;
  } | null;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Hazırlanıyor", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  shipped: { label: "Kargolandı", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  delivered: { label: "Teslim Edildi", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  cancelled: { label: "İptal", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(amount);

const OrderDetailModal = ({ isOpen, onClose, order }: OrderDetailModalProps) => {
  if (!order) return null;

  const items: OrderItem[] = Array.isArray(order.items) ? (order.items as OrderItem[]) : [];
  const status = statusLabels[order.status || "pending"] || statusLabels.pending;
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Sipariş Detayı
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order meta */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs border ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">{orderDate}</p>

          {/* Items list */}
          <div className="space-y-2 border-t border-border pt-3">
            {items.map((item, i) => (
              <div key={item.id || i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{item.title || "Ürün"}</p>
                  <p className="text-muted-foreground text-xs">x{item.quantity || 1}</p>
                </div>
                <p className="text-foreground text-sm font-display">
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-3 space-y-2">
            {(order.total_coins_used ?? 0) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> BioCoin Kullanıldı
                </span>
                <span className="text-amber-400 font-medium">{order.total_coins_used}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium">Toplam</span>
              <span className="font-display text-xl text-foreground">{formatCurrency(Number(order.total_price))}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
