import { motion, AnimatePresence } from "framer-motion";
import { Check, RefreshCw, AlertTriangle, Pill, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";

export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  servingsLeft: number;
  totalServings: number;
  takenToday: boolean;
  icon: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
}

interface SupplementTrackerProps {
  supplements: Supplement[];
  onToggleTaken: (id: string) => void;
  onRefill: (id: string) => void;
}

// Mock product data for supplements that can be ordered
const supplementProducts: Record<string, { price: number; image: string }> = {
  "sup-1": { price: 350, image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=300&h=300&fit=crop" },
  "sup-2": { price: 450, image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&h=300&fit=crop" },
  "sup-3": { price: 180, image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&h=300&fit=crop" },
  "sup-4": { price: 120, image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&h=300&fit=crop" },
  "sup-5": { price: 150, image: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&h=300&fit=crop" },
};

const timingColors: Record<string, string> = {
  "Sabah": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Öğle": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Akşam": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Antrenman Öncesi": "bg-red-500/20 text-red-400 border-red-500/30",
  "Antrenman Sonrası": "bg-green-500/20 text-green-400 border-green-500/30",
};

const SupplementCard = ({
  supplement,
  onToggle,
  onRefill,
  onOrder,
}: {
  supplement: Supplement;
  onToggle: () => void;
  onRefill: () => void;
  onOrder: () => void;
}) => {
  const stockPercentage = (supplement.servingsLeft / supplement.totalServings) * 100;
  const isLowStock = supplement.servingsLeft <= 5;
  const isCritical = supplement.servingsLeft <= 3;

  const handleToggle = () => {
    onToggle();
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card p-4 border transition-all",
        supplement.takenToday 
          ? "border-primary/30 bg-primary/5" 
          : "border-white/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggle}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 mt-0.5",
            supplement.takenToday
              ? "bg-primary border-primary text-primary-foreground"
              : "border-zinc-600 hover:border-zinc-400"
          )}
        >
          <AnimatePresence>
            {supplement.takenToday && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check size={14} strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg">{supplement.icon}</span>
              <span className={cn(
                "font-medium text-sm transition-colors truncate",
                supplement.takenToday ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {supplement.name}
              </span>
            </div>
            
            {/* Stock Alert Badge */}
            {isLowStock && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 flex-shrink-0",
                isCritical 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              )}>
                <AlertTriangle size={10} />
                {isCritical ? "KRİTİK" : "STOK DÜŞÜK"}
              </span>
            )}
          </div>

          {/* Dosage & Timing */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">{supplement.dosage}</span>
            <span className="text-muted-foreground/40">•</span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              timingColors[supplement.timing] || "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
            )}>
              {supplement.timing}
            </span>
          </div>

          {/* Stock Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Progress 
                value={stockPercentage} 
                className={cn(
                  "h-2 bg-white/5",
                  "[&>div]:transition-all [&>div]:duration-500",
                  isCritical && "[&>div]:bg-red-500",
                  isLowStock && !isCritical && "[&>div]:bg-amber-500",
                  !isLowStock && "[&>div]:bg-primary"
                )}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono min-w-[60px] text-right">
              {supplement.servingsLeft}/{supplement.totalServings}
            </span>
            
            {/* Refill Button */}
            {isLowStock && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefill}
                className="h-7 px-2 text-xs bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/50"
              >
                <RefreshCw size={12} className="mr-1" />
                YENİLE
              </Button>
            )}
          </div>

          {/* Critical Warning with Order Button */}
          {isCritical && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-center justify-between gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} />
                <span>{supplement.servingsLeft} gün kaldı!</span>
              </div>
              <Button
                size="sm"
                onClick={onOrder}
                className="h-6 px-2 text-[10px] bg-red-500 text-white hover:bg-red-600"
              >
                <ShoppingCart size={10} className="mr-1" />
                SİPARİŞ VER
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SupplementTracker = ({ supplements, onToggleTaken, onRefill }: SupplementTrackerProps) => {
  const { addToCart } = useCart();
  const takenCount = supplements.filter(s => s.takenToday).length;
  const totalCount = supplements.length;
  const completionPercentage = (takenCount / totalCount) * 100;

  const handleOrderSupplement = (supplement: Supplement) => {
    const productInfo = supplementProducts[supplement.id] || { price: 200, image: "" };
    addToCart({
      id: `order-${supplement.id}-${Date.now()}`,
      title: supplement.name,
      price: productInfo.price,
      image: productInfo.image,
      type: "supplement",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Pill className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
              GÜNLÜK SUPPLEMENT TAKİBİ
            </h2>
            <p className="text-xs text-muted-foreground">
              {takenCount}/{totalCount} alındı
            </p>
          </div>
        </div>
        
        {/* Completion Ring */}
        <div className="relative w-12 h-12">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-white/5"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={125.6}
              initial={{ strokeDashoffset: 125.6 }}
              animate={{ strokeDashoffset: 125.6 - (completionPercentage / 100) * 125.6 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              strokeLinecap="round"
              className="text-primary"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">{Math.round(completionPercentage)}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-primary rounded-full"
        />
      </div>

      {/* Supplement Cards */}
      <div className="space-y-3">
        {supplements.map((supplement) => (
          <SupplementCard
            key={supplement.id}
            supplement={supplement}
            onToggle={() => onToggleTaken(supplement.id)}
            onRefill={() => onRefill(supplement.id)}
            onOrder={() => handleOrderSupplement(supplement)}
          />
        ))}
      </div>

      {/* All Done Message */}
      <AnimatePresence>
        {takenCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20"
          >
            <Check className="w-5 h-5 text-primary" />
            <span className="font-display text-sm text-primary tracking-wide">
              TÜM SUPPLEMENTLER ALINDI! 💪
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplementTracker;