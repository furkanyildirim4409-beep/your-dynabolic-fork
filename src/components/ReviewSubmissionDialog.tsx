import { useState } from "react";
import { z } from "zod";
import { Star, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useSubmitProductReview } from "@/hooks/useProductReviews";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
}

const schema = z.object({
  rating: z.number().int().min(1, "Lütfen 1-5 arası bir puan verin").max(5),
  comment: z.string().trim().max(500, "Yorum en fazla 500 karakter olabilir"),
});

const ReviewSubmissionDialog = ({ isOpen, onClose, productId, productTitle }: Props) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const submit = useSubmitProductReview();

  const handleSubmit = async () => {
    const result = schema.safeParse({ rating, comment });
    if (!result.success) {
      toast({
        title: "Eksik Bilgi",
        description: result.error.issues[0]?.message ?? "Form geçersiz",
        variant: "destructive",
      });
      return;
    }
    try {
      await submit.mutateAsync({ productId, rating, comment });
      toast({ title: "Değerlendirmen kaydedildi 🌟", description: "Geri bildirimin için teşekkürler!" });
      setRating(0);
      setComment("");
      onClose();
    } catch (err: any) {
      toast({
        title: "Kaydedilemedi",
        description: err?.message ?? "Bilinmeyen hata",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-white/10 text-foreground max-w-md p-0 overflow-hidden z-[9999]">
        <DialogHeader className="p-5 pb-3 border-b border-white/5">
          <DialogTitle className="text-sm font-display uppercase tracking-wider">
            ÜRÜNÜ DEĞERLENDİR
          </DialogTitle>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{productTitle}</p>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Star picker */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hover || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`${n} yıldız`}
                  >
                    <Star
                      className={`w-9 h-9 ${
                        active ? "fill-primary text-primary" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {rating === 0 ? "Puanını seç" : `${rating} / 5`}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Yorum (opsiyonel)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ürün hakkındaki düşüncelerin..."
              className="bg-black/40 border-white/10 min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submit.isPending || rating === 0}
            className="w-full h-12 bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90"
          >
            {submit.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> GÖNDERİLİYOR...
              </span>
            ) : (
              "DEĞERLENDİRMEYİ GÖNDER"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewSubmissionDialog;
