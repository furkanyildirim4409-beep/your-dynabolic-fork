import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Coins, Plus, Minus, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import confetti from "canvas-confetti";
import { useMemo, useState } from "react";
import PaymentModal, { PaymentDetails } from "./PaymentModal";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useBioCoin } from "@/hooks/useBioCoin";
import { Switch } from "@/components/ui/switch";
import { createShopifyCart } from "@/lib/shopify";

const COIN_TO_TL = 0.1;      // 10 BioCoin = 1 TL
const MAX_PCT = 0.20;        // Max 20% discount on eligible (coaching) items

const fireConfetti = () => {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.2, { spread: 60, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
  fire(0.1, { spread: 120, startVelocity: 45, colors: ["#CDDC39", "#8BC34A", "#4CAF50"] });
};

const UniversalCartDrawer = () => {
  const { items, removeFromCart, updateQuantity, clearCart, cartTotal, isCartOpen, closeCart } = useCart();
  const { user } = useAuth();
  const { balance, spendCoins } = useBioCoin();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [useCoinDiscount, setUseCoinDiscount] = useState(false);
  const [shopifyLoading, setShopifyLoading] = useState(false);

  const totalCoinsUsed = items.reduce((acc, item) => acc + (item.coinsUsed || 0) * item.quantity, 0);

  // Cart split — Shopify (physical) vs native coaching
  const shopifyItems = useMemo(
    () => items.filter((i) => i.type === "supplement" || i.type === "product"),
    [items],
  );
  const coachingItems = useMemo(() => items.filter((i) => i.type === "coaching"), [items]);
  const isHybrid = shopifyItems.length > 0 && coachingItems.length > 0;
  const hasShopify = shopifyItems.length > 0;
  const hasCoaching = coachingItems.length > 0;

  // BioCoin discount applies ONLY to coaching items (Shopify checkout has no discount-code support yet)
  const eligibleSubtotal = coachingItems.reduce(
    (s, i) => s + (i.discountedPrice ?? i.price) * i.quantity,
    0,
  );
  const maxDiscountTL = Math.floor(eligibleSubtotal * MAX_PCT);
  const maxCoinsUsable = Math.min(balance, Math.floor(maxDiscountTL / COIN_TO_TL));
  const canUseCoinDiscount = hasCoaching && balance > 0 && maxDiscountTL > 0;
  const coinDiscount = useCoinDiscount && canUseCoinDiscount ? maxCoinsUsable * COIN_TO_TL : 0;
  const coinsSpent = useCoinDiscount && canUseCoinDiscount ? maxCoinsUsable : 0;
  const coachingTotal = coachingItems.reduce((s, i) => s + (i.discountedPrice ?? i.price) * i.quantity, 0);
  const finalCoachingTotal = Math.max(0, coachingTotal - coinDiscount);
  const finalTotal = Math.max(0, cartTotal - coinDiscount);

  const getCoachingPaymentDetails = (): PaymentDetails => {
    const itemSummary = coachingItems.length === 1 ? coachingItems[0].title : `${coachingItems.length} Koçluk Paketi`;
    return {
      amount: finalCoachingTotal,
      title: itemSummary,
      description: coachingItems.map((i) => `${i.title} x${i.quantity}`).join(", "),
      type: "coaching",
      referenceId: `CART-${Date.now()}`,
    };
  };

  const redirectToShopifyCheckout = async () => {
    if (shopifyItems.length === 0) return;
    setShopifyLoading(true);
    try {
      const lines = shopifyItems
        .filter((i) => !!i.shopifyVariantId)
        .map((i) => ({ merchandiseId: i.shopifyVariantId!, quantity: i.quantity }));
      if (lines.length === 0) {
        throw new Error("Shopify ürünlerinde variant bilgisi eksik.");
      }
      const url = await createShopifyCart(lines);
      // Clear shopify items locally — Shopify owns the order from this point on
      shopifyItems.forEach((i) => removeFromCart(i.id));
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Shopify checkout başarısız",
        description: err?.message ?? "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setShopifyLoading(false);
    }
  };

  const handleCheckout = async () => {
    // 1) Coaching present → native PaymentModal first (Shopify redirect happens onSuccess)
    if (hasCoaching) {
      closeCart();
      setTimeout(() => setShowPaymentModal(true), 100);
      return;
    }
    // 2) Shopify-only → straight to Shopify checkout
    if (hasShopify) {
      await redirectToShopifyCheckout();
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user) return;

    if (coinsSpent > 0) {
      const success = await spendCoins(coinsSpent, "purchase", "Koçluk İndirimi");
      if (!success) return;
    }

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      items: coachingItems.map((i) => ({
        id: i.id, title: i.title, price: i.price, quantity: i.quantity, image: i.image, type: i.type,
      })) as any,
      total_price: finalCoachingTotal,
      total_coins_used: coinsSpent,
      status: "pending",
    });

    if (error) {
      toast({ title: "Sipariş kaydedilemedi", description: error.message, variant: "destructive" });
      return;
    }

    fireConfetti();
    coachingItems.forEach((i) => removeFromCart(i.id));
    setUseCoinDiscount(false);
    toast({ title: "Koçluk Siparişi Tamamlandı! 🎉", description: "Şimdi Shopify ürünlerine yönlendiriliyorsun..." });

    // Continue to Shopify if hybrid
    if (hasShopify) {
      setTimeout(() => redirectToShopifyCheckout(), 600);
    } else {
      clearCart();
      closeCart();
    }
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
                if (info.offset.y > 100 || info.velocity.y > 500) closeCart();
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 w-full max-w-[430px] mx-auto bg-[hsl(var(--background))] border-t border-border rounded-t-3xl max-h-[85vh] flex flex-col touch-none"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="font-display text-lg text-foreground">SEPETİM</h2>
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} Ürün
                  </span>
                </div>
                <button onClick={closeCart} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Content */}
              <div className="flex flex-col flex-1 overflow-hidden">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-foreground font-medium">Sepetiniz Boş</p>
                    <p className="text-muted-foreground text-sm mt-1">Mağazadan ürün ekleyerek alışverişe başlayın</p>
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
                          className="bg-muted/50 border border-border rounded-xl p-3 flex gap-3"
                        >
                          <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground text-sm font-medium line-clamp-2">{item.title}</p>
                            {item.coachName && <p className="text-muted-foreground text-xs mt-0.5">{item.coachName}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              {item.discountedPrice ? (
                                <>
                                  <span className="text-muted-foreground text-xs line-through">{item.price}₺</span>
                                  <span className="text-primary font-display text-sm">{item.discountedPrice}₺</span>
                                </>
                              ) : (
                                <span className="text-primary font-display text-sm">{item.price}₺</span>
                              )}
                              {item.coinsUsed && item.coinsUsed > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <Coins className="w-3 h-3" />-{item.coinsUsed}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                              >
                                <Minus className="w-3 h-3 text-foreground" />
                              </button>
                              <span className="text-sm text-foreground font-medium w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
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
                    <div className="border-t border-border p-4 space-y-4 bg-[hsl(var(--background))]">
                      {/* Hybrid checkout disclaimer */}
                      {isHybrid && (
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex gap-2">
                          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-foreground leading-relaxed">
                            Bu sepette 2 farklı ödeme akışı var. <span className="text-primary font-medium">Koçluk</span> ödemesi uygulama içinden, <span className="text-primary font-medium">fiziksel ürün</span> ödemesi Shopify üzerinden güvenle yapılacaktır.
                          </p>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Ara Toplam</span>
                          <span className="text-foreground">{cartTotal}₺</span>
                        </div>
                        {totalCoinsUsed > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Coins className="w-4 h-4 text-primary" /> Kullanılan Coin
                            </span>
                            <span className="text-primary">{totalCoinsUsed.toLocaleString()}</span>
                          </div>
                        )}

                        {/* BioCoin Discount Section — coaching only */}
                        {canUseCoinDiscount ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-primary/10 border border-primary/20 rounded-xl p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="text-xs font-display text-foreground">BİOCOİN İNDİRİMİ</p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">
                                    Maks. {maxDiscountTL}₺ ({maxCoinsUsable} coin) · Sadece koçluk paketleri
                                  </p>
                                </div>
                              </div>
                              <Switch checked={useCoinDiscount} onCheckedChange={setUseCoinDiscount} />
                            </div>
                            {useCoinDiscount && (
                              <div className="flex items-center justify-between text-xs text-primary font-display pt-1 border-t border-primary/10">
                                <span>Bakiye: {balance.toLocaleString()} coin</span>
                                <span>-{coinDiscount}₺</span>
                              </div>
                            )}
                          </motion.div>
                        ) : null}

                        {/* Shopify-only or hybrid: BioCoin disclaimer for physical items */}
                        {hasShopify && (
                          <div className="bg-muted/40 border border-border rounded-xl p-2.5 flex items-start gap-2">
                            <Coins className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              Shopify ürünlerinde BioCoin kullanımı çok yakında (Part 8.3) aktif olacaktır.
                            </p>
                          </div>
                        )}

                        {coinDiscount > 0 && (
                          <div className="flex items-center justify-between text-sm text-primary">
                            <span>BioCoin İndirimi</span>
                            <span>-{coinDiscount}₺</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-foreground font-display">TOPLAM</span>
                          <span className="text-primary font-display text-xl">{finalTotal}₺</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <Button
                          onClick={handleCheckout}
                          disabled={shopifyLoading}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display h-12"
                        >
                          {shopifyLoading ? (
                            "SHOPIFY'A YÖNLENDİRİLİYOR..."
                          ) : isHybrid ? (
                            <span className="flex items-center gap-2">KOÇLUK + SHOPIFY ÖDE <ExternalLink className="w-4 h-4" /></span>
                          ) : hasShopify ? (
                            <span className="flex items-center gap-2">SHOPIFY İLE ÖDE <ExternalLink className="w-4 h-4" /></span>
                          ) : (
                            "ÖDEMEYE GEÇ"
                          )}
                        </Button>
                        <Button variant="outline" onClick={clearCart} className="w-full border-border text-muted-foreground hover:text-destructive h-10">
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payment={coachingItems.length > 0 ? getCoachingPaymentDetails() : null}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default UniversalCartDrawer;
