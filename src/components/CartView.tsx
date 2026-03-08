import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2, X, CreditCard, Tag, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";

interface CartViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartView = ({ isOpen, onClose }: CartViewProps) => {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "DYNABOLIC10") {
      setDiscount(10);
      setPromoApplied(true);
    } else if (promoCode.toUpperCase() === "COACH20") {
      setDiscount(20);
      setPromoApplied(true);
    }
  };

  const discountedTotal = totalPrice * (1 - discount / 100);
  const shipping = totalPrice > 500 ? 0 : 29.90;
  const grandTotal = discountedTotal + shipping;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Sepetim ({totalItems})</h2>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(100vh - 320px)" }}>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground text-sm">Sepetiniz boş</p>
                <p className="text-muted-foreground text-xs mt-1">Mağazadan ürün ekleyin</p>
              </div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 flex gap-3"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">{item.name}</p>
                    <p className="text-primary text-sm font-bold mt-1">₺{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <span className="text-foreground text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto p-1.5 text-destructive/60 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-4 space-y-3">
              {/* Promo */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promosyon kodu"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                  />
                </div>
                <Button onClick={applyPromo} size="sm" variant="outline" disabled={promoApplied}>
                  {promoApplied ? "✓" : "Uygula"}
                </Button>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara Toplam</span>
                  <span>₺{totalPrice.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>İndirim (%{discount})</span>
                    <span>-₺{(totalPrice * discount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Kargo</span>
                  <span>{shipping === 0 ? "Ücretsiz" : `₺${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-foreground font-bold text-base pt-1.5 border-t border-border">
                  <span>Toplam</span>
                  <span className="text-primary">₺{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full" onClick={() => {}}>
                <CreditCard className="w-4 h-4 mr-2" />
                Ödemeye Geç
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>

              <button onClick={clearCart} className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors">
                Sepeti Temizle
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartView;
