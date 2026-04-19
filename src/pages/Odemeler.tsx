import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Truck,
  Package,
  Star,
  MapPin,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import ReviewSubmissionDialog from "@/components/ReviewSubmissionDialog";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  type?: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  order_type: string;
  total_price: number;
  total_coins_used: number | null;
  items: OrderItem[];
  shipping_address: any;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  paid: { label: "Ödendi", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/15" },
  completed: { label: "Teslim Edildi", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/15" },
  shipped: { label: "Kargoda", icon: Truck, color: "text-blue-400", bg: "bg-blue-500/15" },
  processing: { label: "İşleniyor", icon: Package, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  pending: { label: "Bekliyor", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  cancelled: { label: "İptal", icon: XCircle, color: "text-red-400", bg: "bg-red-500/15" },
  overdue: { label: "Gecikmiş", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/15" },
};

const PHYSICAL = new Set(["product", "supplement"]);
const REVIEWABLE_STATUSES = new Set(["processing", "shipped", "completed", "paid"]);

const Odemeler = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, created_at, status, order_type, total_price, total_coins_used, items, shipping_address",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (!error && data) {
          setOrders(
            data.map((o: any) => ({
              ...o,
              items: Array.isArray(o.items) ? o.items : [],
            })),
          );
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total_price ?? 0), 0);
  const completedCount = orders.filter((o) =>
    ["completed", "paid"].includes(o.status),
  ).length;
  const pendingCount = orders.filter((o) =>
    ["pending", "processing", "shipped"].includes(o.status),
  ).length;

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">SİPARİŞLERİM</h1>
        </div>
        <p className="text-muted-foreground text-xs">Tüm sipariş ve ödeme geçmişin</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Toplam Harcama", value: `₺${totalSpent.toLocaleString("tr-TR")}`, color: "text-foreground" },
          { label: "Tamamlanan", value: String(completedCount), color: "text-green-400" },
          { label: "Devam Eden", value: String(pendingCount), color: "text-yellow-400" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-3 text-center"
          >
            <p className={`font-display text-lg ${s.color}`}>{s.value}</p>
            <p className="text-muted-foreground text-[10px]">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Yükleniyor...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-medium text-sm">Henüz siparişin yok</p>
          <p className="text-muted-foreground text-xs mt-1">Mağaza veya koçluk paketlerine göz at</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const config = statusConfig[order.status] ?? statusConfig.pending;
            const Icon = config.icon;
            const isShopify = order.order_type === "shopify";
            const canReview = REVIEWABLE_STATUSES.has(order.status);
            const dateStr = new Date(order.created_at).toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const addr = order.shipping_address;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isShopify ? (
                      <Package className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-foreground text-sm font-medium">
                      {isShopify ? "Mağaza Siparişi" : "Koçluk Paketi"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} flex items-center gap-1`}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => {
                    const isPhysical = PHYSICAL.has(item.type ?? "");
                    return (
                      <div
                        key={`${order.id}-${idx}`}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-xs font-medium line-clamp-1">{item.title}</p>
                          <p className="text-muted-foreground text-[10px]">
                            x{item.quantity} · ₺{Number(item.price).toLocaleString("tr-TR")}
                          </p>
                        </div>
                        {isPhysical && canReview && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReviewTarget({ id: item.id, title: item.title })}
                            className="h-8 px-2 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <Star className="w-3 h-3" />
                            Değerlendir
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Address (Shopify only) */}
                {isShopify && addr && typeof addr === "object" && (
                  <div className="flex items-start gap-2 pt-2 border-t border-white/5 text-[10px] text-muted-foreground">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {addr.fullName} · {addr.district}/{addr.city}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <p className="text-muted-foreground text-[10px]">{dateStr}</p>
                  <p className="font-display text-base text-foreground">
                    ₺{Number(order.total_price).toLocaleString("tr-TR")}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewSubmissionDialog
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          productId={reviewTarget.id}
          productTitle={reviewTarget.title}
        />
      )}
    </div>
  );
};

export default Odemeler;
