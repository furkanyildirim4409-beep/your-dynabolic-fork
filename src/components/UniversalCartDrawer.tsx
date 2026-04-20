import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Trash2, Coins, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import confetti from "canvas-confetti";
import { useMemo, useState } from "react";
import PaymentModal, { PaymentDetails } from "./PaymentModal";
import NativeCheckoutModal, { ShippingAddress } from "./NativeCheckoutModal";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useBioCoin } from "@/hooks/useBioCoin";
import { Switch } from "@/components/ui/switch";

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
  const [showNativeCheckout, setShowNativeCheckout] = useState(false);
  const [showShopifyPayment, setShowShopifyPayment] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<ShippingAddress | null>(null);
  const [useCoinDiscount, setUseCoinDiscount] = useState(false);

  const totalCoinsUsed = items.reduce((acc, item) => acc + (item.coinsUsed || 0) * item.quantity, 0);

  // Cart split — Shopify (physical) vs native coaching
  const shopifyItems = useMemo(
    () => items.filter((i) => i.type === "supplement" || i.type === "product"),
    [items],
  );
  const coachingItems = useMemo(() => items.filter((i) => i.type === "coaching"), [items]);
  const hasShopify = shopifyItems.length > 0;
  const hasCoaching = coachingItems.length > 0;

  // BioCoin discount applies ONLY to coaching items
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

  const getShopifyPaymentDetails = (): PaymentDetails => {
    const itemSummary = shopifyItems.length === 1 ? shopifyItems[0].title : `${shopifyItems.length} Ürün`;
    return {
      amount: cartTotal,
      title: itemSummary,
      description: shopifyItems.map((i) => `${i.title} x${i.quantity}`).join(", "),
      type: "store",
      referenceId: `SHOP-${Date.now()}`,
    };
  };

  const handleCheckout = () => {
    if (hasCoaching) {
      closeCart();
      setTimeout(() => setShowPaymentModal(true), 100);
      return;
    }
    if (hasShopify) {
      closeCart();
      setTimeout(() => setShowNativeCheckout(true), 100);
    }
  };

  const handleAddressConfirm = (address: ShippingAddress) => {
    setPendingAddress(address);
    setShowNativeCheckout(false);
    setTimeout(() => setShowShopifyPayment(true), 100);
  };

  const handleCoachingPaymentSuccess = async () => {
    if (!user) return;

    if (coinsSpent > 0) {
      const success = await spendCoins(coinsSpent, "purchase", "Koçluk İndirimi");
      if (!success) return;
    }

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      order_type: "coaching",
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
    toast({ title: "Koçluk Siparişi Tamamlandı! 🎉", description: "Koçun en kısa sürede seninle iletişime geçecek." });

    clearCart();
    closeCart();
  };

  const handleShopifyPaymentSuccess = async () => {
    if (!user || !pendingAddress) return;

    const { data: inserted, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_type: "shopify",
        items: shopifyItems.map((i) => ({
          id: i.id, title: i.title, price: i.price, quantity: i.quantity, image: i.image, type: i.type,
          shopifyVariantId: i.shopifyVariantId,
        })) as any,
        total_price: cartTotal,
        shipping_address: pendingAddress as any,
        status: "processing",
        external_reference_id: `SHOP-${Date.now()}`,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Sipariş kaydedilemedi", description: error.message, variant: "destructive" });
      return;
    }

    // Fire-and-forget: mirror order to Shopify Admin (warehouse fulfillment)
    if (inserted?.id) {
      const validShopifyItems = shopifyItems.filter((i) => i.shopifyVariantId);
      if (validShopifyItems.length > 0) {
        void supabase.functions
          .invoke("sync-shopify-order", {
            body: {
              orderId: inserted.id,
              shippingAddress: pendingAddress,
              items: validShopifyItems.map((i) => ({
                shopifyVariantId: i.shopifyVariantId!,
                quantity: i.quantity,
                price: i.price,
                title: i.title,
              })),
            },
          })
          .then(({ data, error: syncErr }) => {
            if (syncErr) {
              console.warn("Shopify Admin sync failed; order kept locally for manual reconciliation.", syncErr);
              return;
            }

            if (data && typeof data === "object" && "deferred" in data && data.deferred) {
              console.warn("Shopify Admin sync deferred until merchant approval for write_orders scope.", data);
            }
          })
          .catch((syncErr) => {
            console.warn("Shopify Admin sync request failed; order kept locally for manual reconciliation.", syncErr);
          });
      }
    }

    fireConfetti();
    shopifyItems.forEach((i) => removeFromCart(i.id));
    setPendingAddress(null);
    toast({
      title: "Sipariş Alındı! 📦",
      description: "Siparişin işleme alındı. Kargo bilgilendirmesi yakında gönderilecek.",
    });

    clearCart();
    closeCart();
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
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

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

              <div className="flex flex-col flex-1 overflow-hidden">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-foreground font-medium">Sepetiniz Boş</p>
                    <p className="text-muted-foreground text-sm mt-1">Mağazadan ürün ekleyerek alışverişe başlayın</p>
                  </div>
                ) : (
                  <>
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

                    <div className="border-t border-border p-4 space-y-4 bg-[hsl(var(--background))]">
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

                        {hasShopify && (
                          <div className="bg-muted/40 border border-border rounded-xl p-2.5 flex items-start gap-2">
                            <Coins className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              Shopify ürünlerinde BioCoin kullanımı çok yakında aktif olacaktır.
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

                      <div className="space-y-2">
                        <Button
                          onClick={handleCheckout}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display h-12"
                        >
                          {hasShopify ? "SİPARİŞİ TAMAMLA" : "ÖDEMEYE GEÇ"}
                        </Button>
                        {hasShopify && (
                          <p className="text-[10px] text-muted-foreground text-center leading-tight px-2">
                            Fiziksel ürün siparişleri için adres ve ödeme adımı bir sonraki ekranda alınacaktır.
                          </p>
                        )}
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

      {/* Coaching payment */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        payment={coachingItems.length > 0 ? getCoachingPaymentDetails() : null}
        onPaymentSuccess={handleCoachingPaymentSuccess}
      />

      {/* Shopify native checkout: address → payment */}
      <NativeCheckoutModal
        isOpen={showNativeCheckout}
        onClose={() => setShowNativeCheckout(false)}
        total={cartTotal}
        itemCount={shopifyItems.reduce((acc, i) => acc + i.quantity, 0)}
        onConfirm={handleAddressConfirm}
      />
      <PaymentModal
        isOpen={showShopifyPayment}
        onClose={() => setShowShopifyPayment(false)}
        payment={shopifyItems.length > 0 && pendingAddress ? getShopifyPaymentDetails() : null}
        onPaymentSuccess={handleShopifyPaymentSuccess}
      />
    </>
  );
};

export default UniversalCartDrawer;
