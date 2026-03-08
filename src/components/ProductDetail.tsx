import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Coins, Star, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductDetailProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    image: string;
    type: string;
    coachName: string;
    coachId: string;
    bioCoins?: number;
  } | null;
  onAddToCart: (product: any) => void;
}

const ProductDetail = ({ isOpen, onClose, product, onAddToCart }: ProductDetailProps) => {
  if (!product) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ebook": return "E-KİTAP";
      case "pdf": return "PDF";
      case "apparel": return "GİYİM";
      case "equipment": return "EKİPMAN";
      default: return type.toUpperCase();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 500) onClose(); }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-secondary rounded-t-2xl sm:rounded-2xl border border-white/10 max-h-[85vh] flex flex-col overflow-hidden touch-none"
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="relative aspect-square bg-muted">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">{getTypeLabel(product.type)}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-muted-foreground text-sm">{product.coachName}</p>
                  <h2 className="text-foreground font-display text-xl mt-1">{product.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= 4 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">(4.0) • 128 değerlendirme</span>
                </div>

                <div className="flex gap-4 py-4 border-y border-white/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="w-4 h-4 text-primary" /><span>Anında Teslimat</span></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="w-4 h-4 text-primary" /><span>Güvenli Ödeme</span></div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Bu ürün {product.coachName} tarafından hazırlanmış profesyonel bir içeriktir. 
                  Antrenman ve beslenme hedeflerinize ulaşmanızda size yardımcı olacak detaylı 
                  bilgiler içermektedir. Satın aldıktan sonra içeriğe anında erişim sağlayabilirsiniz.
                </p>

                {product.bioCoins && (
                  <div className="flex items-center gap-2 bg-primary/10 p-3 rounded-xl">
                    <Coins className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-foreground text-sm font-medium">Bio-Coin ile indirim!</p>
                      <p className="text-muted-foreground text-xs">Bu üründe {product.bioCoins} Bio-Coin kullanabilirsin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 left-0 right-0 p-4 bg-secondary border-t border-white/10">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">FİYAT</p>
                  <p className="text-primary font-display text-2xl">{product.price}₺</p>
                </div>
                <Button onClick={() => { onAddToCart(product); onClose(); }} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-display h-12">
                  <ShoppingBag className="w-5 h-5 mr-2" />SEPETE EKLE
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductDetail;
