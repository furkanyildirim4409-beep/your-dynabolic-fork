import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Coins, ShoppingCart } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { shopSupplements, ShopSupplement } from "@/lib/mockData";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Bio-Coin Discount Calculator (GLOBAL RULE: Max 20% discount)
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

// Check if user has more coins than the 20% cap allows
const hasExcessCoins = (productPrice: number, userCoins: number): boolean => {
  const maxAllowedByPercentage = productPrice * MAX_DISCOUNT_PERCENTAGE;
  const maxPossibleFromCoins = userCoins * COIN_TO_TL_RATE;
  return maxPossibleFromCoins > maxAllowedByPercentage;
};

const getCategoryLabel = (category: ShopSupplement["category"]): string => {
  const labels: Record<ShopSupplement["category"], string> = {
    protein: "PROTEİN",
    amino: "AMİNO",
    preworkout: "PRE-WORKOUT",
    creatine: "KREATİN",
    vitamin: "VİTAMİN",
    omega: "OMEGA",
  };
  return labels[category];
};

const SupplementShop = () => {
  const { addToCart } = useCart();
  const { profile, user, refreshProfile } = useAuth();
  const bioCoins = profile?.bio_coins ?? 0;
  const [coinDiscounts, setCoinDiscounts] = useState<Record<string, boolean>>({});
  const [selectedFlavors, setSelectedFlavors] = useState<Record<string, string>>({});

  const handleAddToCart = (supplement: ShopSupplement) => {
    const isDiscountActive = coinDiscounts[supplement.id] || false;
    const maxDiscount = calculateMaxDiscount(supplement.price, bioCoins);
    const coinsNeeded = calculateCoinsNeeded(maxDiscount);
    const selectedFlavor = selectedFlavors[supplement.id] || supplement.flavors[0] || "";

    const title = selectedFlavor 
      ? `${supplement.name} - ${selectedFlavor}` 
      : supplement.name;

    addToCart({
      id: `${supplement.id}-${selectedFlavor}-${Date.now()}`,
      title,
      price: supplement.price,
      discountedPrice: isDiscountActive ? Math.round(supplement.price - maxDiscount) : undefined,
      coinsUsed: isDiscountActive ? coinsNeeded : undefined,
      image: supplement.image,
      coachName: supplement.brand,
      type: "supplement",
    });

    if (isDiscountActive) {
      setBioCoins((prev) => prev - coinsNeeded);
      setCoinDiscounts((prev) => ({ ...prev, [supplement.id]: false }));
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

      {/* Supplements Grid */}
      <div className="grid grid-cols-2 gap-3">
        {shopSupplements.map((supplement, index) => {
          const maxDiscount = calculateMaxDiscount(supplement.price, bioCoins);
          const isDiscountActive = coinDiscounts[supplement.id] || false;
          const coinsNeeded = calculateCoinsNeeded(maxDiscount);
          const discountedPrice = supplement.price - maxDiscount;
          const remainingCoins = bioCoins - coinsNeeded;
          const selectedFlavor = selectedFlavors[supplement.id] || supplement.flavors[0] || "";

          return (
            <motion.div
              key={supplement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden"
            >
              {/* Product Image */}
              <div className="aspect-square bg-muted relative">
                <img
                  src={supplement.image}
                  alt={supplement.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {getCategoryLabel(supplement.category)}
                  </span>
                </div>
                {isDiscountActive && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-stat-hrv text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                      -{Math.round(maxDiscount)}₺
                    </span>
                  </div>
                )}
                {/* Rating Badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-[10px] font-medium">{supplement.rating}</span>
                  <span className="text-white/60 text-[9px]">({supplement.reviews.toLocaleString()})</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-3">
                <p className="text-foreground text-xs font-medium line-clamp-2 h-8">
                  {supplement.name}
                </p>
                <p className="text-muted-foreground text-[10px] mt-1">{supplement.brand}</p>

                {/* Flavor Selector */}
                {supplement.flavors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {supplement.flavors.map((flavor) => (
                      <button
                        key={flavor}
                        onClick={() => setSelectedFlavors((prev) => ({ ...prev, [supplement.id]: flavor }))}
                        className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
                          selectedFlavor === flavor
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-white/10 hover:border-white/30"
                        }`}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-center justify-between mt-2">
                  {isDiscountActive ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs line-through">{supplement.price}₺</span>
                      <span className="text-primary font-display text-sm">{Math.round(discountedPrice)}₺</span>
                    </div>
                  ) : (
                    <span className="text-primary font-display text-sm">{supplement.price}₺</span>
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
                          setCoinDiscounts((prev) => ({ ...prev, [supplement.id]: checked }));
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
                                <span className="text-primary font-medium">{coinsNeeded.toLocaleString()} BIO</span>
                              </div>
                              <div className="flex justify-between text-[9px]">
                                <span className="text-muted-foreground">Kalan Bakiye:</span>
                                <span className="text-foreground">{remainingCoins.toLocaleString()} BIO</span>
                              </div>
                              {hasExcessCoins(supplement.price, bioCoins) && (
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
                  onClick={() => handleAddToCart(supplement)}
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
    </div>
  );
};

export default SupplementShop;