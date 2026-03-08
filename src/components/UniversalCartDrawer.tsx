import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Coins, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import confetti from "canvas-confetti";
import { useState } from "react";
import PaymentModal, { PaymentDetails } from "./PaymentModal";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const fireConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.2, { spread: 60, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
};

const UniversalCartDrawer = () => {
  const { items, removeFromCart, updateQuantity, clearCart, cartTotal, isCartOpen, closeCart } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const totalCoinsUsed = items.reduce((acc, item) => acc + (item.coinsUsed || 0) * item.quantity, 0);

  const getPaymentDetails = (): PaymentDetails => {
    const itemTypes = [...new Set(items.map(i => i.type))];
    const primaryType = itemTypes.includes("coaching") ? "coaching" : 
                       itemTypes.includes("supplement") ? "supplement" : "store";
    
    const itemSummary = items.length === 1 
      ? items[0].title 
      : `${items.length} Ürün`;

    return {
      amount: cartTotal,
      title: itemSummary,
      description: items.map(i => `${i.title} x${i.quantity}`).join(", "),
      type: primaryType,
      referenceId: `CART-${Date.now()}`,
    };
  };

  const handleCheckout = () => {
    // Close cart first, then open payment modal to avoid z-index conflict
    closeCart();
    // Small delay to ensure cart is closed before modal opens
    setTimeout(() => {
      setShowPaymentModal(true);
    }, 100);
  };

  const handlePaymentSuccess = () => {
    fireConfetti();
    clearCart();
    closeCart();
    toast({
      title: "Sipariş Tamamlandı! 🎉",
      description: "Siparişiniz başarıyla oluşturuldu.",
    });
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm"
            onClick={closeCart}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  closeCart();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 w-full max-w-[430px] mx-auto bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl max-h-[85vh] flex flex-col touch-none"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg text-foreground">SEPETİM</h2>
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} Ürün
                  </span>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Content */}
              <div className="flex flex-col flex-1 overflow-hidden">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-foreground font-medium">Sepetiniz Boş</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Mağazadan ürün ekleyerek alışverişe başlayın
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3"
                        >
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-medium line-clamp-2">
                              {item.title}
                            </p>
                            {item.coachName && (
                              <p className="text-muted-foreground text-xs mt-0.5">
                                {item.coachName}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {item.discountedPrice ? (
                                <>
                                  <span className="text-muted-foreground text-xs line-through">
                                    {item.price}₺
                                  </span>
                                  <span className="text-primary font-display text-sm">
                                    {item.discountedPrice}₺
                                  </span>
                                </>
                              ) : (
                                <span className="text-primary font-display text-sm">
                                  {item.price}₺
                                </span>
                              )}
                              {item.coinsUsed && item.coinsUsed > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <Coins className="w-3 h-3" />
                                  -{item.coinsUsed}
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                              >
                                <Minus className="w-3 h-3 text-foreground" />
                              </button>
                              <span className="text-sm text-foreground font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-foreground" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors self-start"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Cart Footer */}
                    <div className="border-t border-white/10 p-4 space-y-4 bg-[#0a0a0a]">
                      {/* Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ara Toplam</span>
                          <span className="text-foreground">{cartTotal}₺</span>
                        </div>
                        {totalCoinsUsed > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Coins className="w-4 h-4 text-primary" />
                              Kullanılan Coin
                            </span>
                            <span className="text-primary">{totalCoinsUsed.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-foreground font-display">TOPLAM</span>
                          <span className="text-primary font-display text-xl">{cartTotal}₺</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={handleCheckout}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display h-12"
                        >
                          ÖDEMEYE GEÇ
                        </Button>
                        <Button
                          variant="outline"
                          onClick={clearCart}
                          className="w-full border-white/10 text-muted-foreground hover:text-destructive h-10"
                        >
                          Sepeti Temizle
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payment={items.length > 0 ? getPaymentDetails() : null}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default UniversalCartDrawer;