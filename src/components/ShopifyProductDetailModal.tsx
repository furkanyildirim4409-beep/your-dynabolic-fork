import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Star, Truck, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { useProductReviews } from "@/hooks/useProductReviews";
import type { ShopifyProduct } from "@/lib/shopify";

interface ShopifyProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShopifyProduct | null;
  cartType?: "product" | "supplement";
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

const StarRow = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        style={{ width: size, height: size }}
        className={s <= Math.round(value) ? "text-primary fill-primary" : "text-muted-foreground/40"}
      />
    ))}
  </div>
);

const ShopifyProductDetailModal = ({
  isOpen,
  onClose,
  product,
  cartType = "supplement",
}: ShopifyProductDetailModalProps) => {
  const { addToCart } = useCart();
  const { data, isLoading: reviewsLoading } = useProductReviews(product?.id ?? null);

  if (!product) return null;

  const reviews = data?.reviews ?? [];
  const averageRating = data?.averageRating ?? 0;
  const totalCount = data?.totalCount ?? 0;

  const handleAddToCart = () => {
    addToCart({
      id: `${product.variantId}-${Date.now()}`,
      title: product.title,
      price: product.price,
      image: product.imageUrl ?? "/placeholder.svg",
      coachName: "Shopify",
      type: cartType,
      shopifyVariantId: product.variantId,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-secondary rounded-t-2xl sm:rounded-2xl border border-white/10 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Hero image */}
              <div className="relative aspect-square bg-muted">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.imageAlt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                    {cartType === "supplement" ? "TAKVİYE" : "ÜRÜN"}
                  </span>
                </div>
              </div>

              {/* Title + rating */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Shopify</p>
                  <h2 className="text-foreground font-display text-xl mt-1">{product.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <StarRow value={averageRating} />
                  <span className="text-muted-foreground text-sm">
                    {totalCount > 0
                      ? `${averageRating.toFixed(1)} • ${totalCount} değerlendirme`
                      : "Henüz değerlendirme yok"}
                  </span>
                </div>

                <div className="flex gap-4 py-3 border-y border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>Hızlı Kargo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Güvenli Ödeme</span>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-display text-xs text-foreground tracking-wider mb-2">
                      AÇIKLAMA
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Reviews */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-xs text-foreground tracking-wider">
                      DEĞERLENDİRMELER
                    </h3>
                    {totalCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {averageRating.toFixed(1)} / 5 · {totalCount}
                      </span>
                    )}
                  </div>

                  {/* Write review */}
                  {user ? (
                    <div className="glass-card p-3 mb-3 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {userReview ? "Değerlendirmeni güncelle" : "Bu ürüne puan ver"}
                        </p>
                        <InteractiveStars
                          value={effectiveDraftRating}
                          onChange={setDraftRating}
                          disabled={isSubmitting}
                        />
                      </div>
                      <Textarea
                        value={draftComment || (draftRating === 0 ? userReview?.comment ?? "" : draftComment)}
                        onChange={(e) => setDraftComment(e.target.value)}
                        placeholder="Deneyimini paylaş (opsiyonel)..."
                        className="min-h-[70px] bg-background/50 text-sm resize-none"
                        disabled={isSubmitting}
                        maxLength={500}
                      />
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || effectiveDraftRating < 1}
                        size="sm"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : userReview ? (
                          "GÜNCELLE"
                        ) : (
                          "GÖNDER"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="glass-card p-3 mb-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Değerlendirme yapmak için giriş yap.
                      </p>
                    </div>
                  )}

                  {/* Reviews list */}
                  {reviewsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="glass-card p-3 flex gap-3">
                          <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      İlk değerlendirmeyi sen yap!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {reviews.map((r) => (
                        <div key={r.id} className="glass-card p-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={r.author.avatar_url ?? undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {r.author.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground text-xs font-medium truncate">
                                {r.author.full_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <StarRow value={r.rating} size={11} />
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(r.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {r.comment && (
                            <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
                              {r.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-secondary border-t border-white/10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Fiyat</p>
                  <p className="text-primary font-display text-2xl">{product.price}₺</p>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-display h-12"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  SEPETE EKLE
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground/70 italic text-center mt-2">
                Shopify ürünlerinde Bio-Coin yakında
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShopifyProductDetailModal;
