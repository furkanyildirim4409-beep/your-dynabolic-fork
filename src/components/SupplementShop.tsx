import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, ShoppingCart, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useShopifyProducts } from "@/hooks/useStoreData";
import type { ShopifyProduct } from "@/lib/shopify";

// Bio-Coin Discount Calculator (GLOBAL RULE: Max 20% discount, 10 BIO = 1 TL)
const COIN_TO_TL_RATE = 0.1;
const MAX_DISCOUNT_PERCENTAGE = 0.20;

const calculateMaxDiscount = (productPrice: number, userCoins: number): number => {
  const maxAllowedByPercentage = productPrice * MAX_DISCOUNT_PERCENTAGE;
  const maxPossibleFromCoins = userCoins * COIN_TO_TL_RATE;
  return Math.min(maxPossibleFromCoins, maxAllowedByPercentage);
};

const calculateCoinsNeeded = (discountAmount: number): number => {
  return Math.ceil(discountAmount / COIN_TO_TL_RATE);
};

const hasExcessCoins = (productPrice: number, userCoins: number): boolean => {
  const maxAllowedByPercentage = productPrice * MAX_DISCOUNT_PERCENTAGE;
  const maxPossibleFromCoins = userCoins * COIN_TO_TL_RATE;
  return maxPossibleFromCoins > maxAllowedByPercentage;
};

const SupplementShop = () => {
  const { addToCart } = useCart();
  const { profile, user, refreshProfile } = useAuth();
  const bioCoins = profile?.bio_coins ?? 0;
  const [coinDiscounts, setCoinDiscounts] = useState<Record<string, boolean>>({});

  const { data: products, isLoading, error } = useShopifyProducts(20);

  const handleAddToCart = async (product: ShopifyProduct) => {
    const isDiscountActive = coinDiscounts[product.id] || false;
    const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
    const coinsNeeded = calculateCoinsNeeded(maxDiscount);

    if (isDiscountActive && bioCoins < coinsNeeded) {
      toast.error("Yetersiz bakiye!");
      return;
    }

    addToCart({
      id: `${product.variantId}-${Date.now()}`,
      title: product.title,
      price: product.price,
      discountedPrice: isDiscountActive ? Math.round(product.price - maxDiscount) : undefined,
      coinsUsed: isDiscountActive ? coinsNeeded : undefined,
      image: product.imageUrl ?? "/placeholder.svg",
      coachName: "Shopify",
      type: "supplement",
    });

    if (isDiscountActive && user) {
      const newBalance = bioCoins - coinsNeeded;
      await supabase.from("profiles").update({ bio_coins: newBalance }).eq("id", user.id);
      await supabase.from("bio_coin_transactions").insert({
        user_id: user.id,
        amount: -coinsNeeded,
        type: "purchase",
        description: `${product.title} indirimi`,
      });
      await refreshProfile();
      setCoinDiscounts((prev) => ({ ...prev, [product.id]: false }));
      toast.success("Bio-Coin indirimi uygulandı!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Balance Display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <span className="text-foreground text-sm">Bakiyen:</span>
        </div>
        <span className="font-display text-lg text-primary">{bioCoins.toLocaleString()} BIO</span>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-foreground text-sm font-medium">Mağaza yüklenemedi</p>
            <p className="text-muted-foreground text-xs mt-1">
              Shopify bağlantısı yapılandırılmamış veya geçici olarak ulaşılamıyor.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products && products.length === 0 && (
        <div className="glass-card p-6 text-center">
          <p className="text-muted-foreground text-sm">Henüz ürün bulunmuyor.</p>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product, index) => {
            const maxDiscount = calculateMaxDiscount(product.price, bioCoins);
            const isDiscountActive = coinDiscounts[product.id] || false;
            const coinsNeeded = calculateCoinsNeeded(maxDiscount);
            const discountedPrice = product.price - maxDiscount;
            const remainingCoins = bioCoins - coinsNeeded;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card overflow-hidden"
              >
                {/* Product Image */}
                <div className="aspect-square bg-muted relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.imageAlt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No image
                    </div>
                  )}
                  {isDiscountActive && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-stat-hrv text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                        -{Math.round(maxDiscount)}₺
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <p className="text-foreground text-xs font-medium line-clamp-2 h-8">
                    {product.title}
                  </p>

                  {/* Price Display */}
                  <div className="flex items-center justify-between mt-2">
                    {isDiscountActive ? (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs line-through">
                          {product.price}₺
                        </span>
                        <span className="text-primary font-display text-sm">
                          {Math.round(discountedPrice)}₺
                        </span>
                      </div>
                    ) : (
                      <span className="text-primary font-display text-sm">{product.price}₺</span>
                    )}
                  </div>

                  {/* Bio-Coin Toggle */}
                  {maxDiscount > 0 && (
                    <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <Coins className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-[10px] text-muted-foreground truncate">
                            Bio-Coin Kullan
                          </span>
                        </div>
                        <Switch
                          checked={isDiscountActive}
                          onCheckedChange={(checked) => {
                            setCoinDiscounts((prev) => ({ ...prev, [product.id]: checked }));
                          }}
                          className="scale-75"
                        />
                      </div>
                      {isDiscountActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-1.5 pt-1.5 border-t border-white/10"
                        >
                          <div className="flex justify-between text-[9px]">
                            <span className="text-muted-foreground">Kullanılacak:</span>
                            <span className="text-primary font-medium">
                              {coinsNeeded.toLocaleString()} BIO
                            </span>
                          </div>
                          <div className="flex justify-between text-[9px]">
                            <span className="text-muted-foreground">Kalan Bakiye:</span>
                            <span className="text-foreground">
                              {remainingCoins.toLocaleString()} BIO
                            </span>
                          </div>
                          {hasExcessCoins(product.price, bioCoins) && (
                            <div className="mt-1 text-[8px] text-primary/70 italic">
                              Maksimum %20 indirim uygulanabilir
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddToCart(product)}
                    className={`w-full mt-3 text-xs py-2 rounded-lg font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      isDiscountActive
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                        : "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3" />
                    SEPETE EKLE
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplementShop;
