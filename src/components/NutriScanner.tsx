import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Zap, Check, AlertCircle, RotateCcw, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  confidence: number;
}

interface NutriScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdd?: (food: ScannedFood) => void;
}

const mockScanResults: ScannedFood[] = [
  { name: "Tavuk Göğsü (Izgara)", calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: "100g", confidence: 94 },
  { name: "Basmati Pirinç", calories: 130, protein: 2.5, carbs: 28, fat: 0.3, portion: "100g", confidence: 89 },
  { name: "Brokoli (Haşlanmış)", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, portion: "100g", confidence: 91 },
];

const NutriScanner = ({ isOpen, onClose, onFoodAdd }: NutriScannerProps) => {
  const [phase, setPhase] = useState<"camera" | "scanning" | "results">("camera");
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<ScannedFood[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setPhase("camera");
      setScanProgress(0);
      setResults([]);
      setSelectedFoods(new Set());
    }
  }, [isOpen]);

  const startScan = useCallback(() => {
    setPhase("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase("results");
          setResults(mockScanResults);
          return 100;
        }
        return p + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  const toggleFood = (index: number) => {
    setSelectedFoods((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addSelected = () => {
    selectedFoods.forEach((i) => {
      if (results[i]) onFoodAdd?.(results[i]);
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          NutriScan AI
        </h2>
        <button onClick={onClose} className="p-2 rounded-full bg-secondary/80 backdrop-blur-sm">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Camera View */}
      {phase === "camera" && (
        <div className="flex flex-col items-center justify-center h-full px-6">
          <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-card border-2 border-dashed border-border mb-8">
            {/* Simulated camera viewfinder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Yemeğinizi çerçeveye alın</p>
              </div>
            </div>
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
            {/* Scan line */}
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <Button onClick={startScan} size="lg" className="gap-2 px-8">
            <Search className="w-5 h-5" />
            Tara
          </Button>
          <p className="text-muted-foreground text-xs mt-3 text-center">
            AI ile yemek tanıma — makro değerleri otomatik hesapla
          </p>
        </div>
      )}

      {/* Scanning Phase */}
      {phase === "scanning" && (
        <div className="flex flex-col items-center justify-center h-full px-6">
          <motion.div
            className="w-24 h-24 rounded-full border-4 border-primary/30 flex items-center justify-center mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <h3 className="text-foreground font-display text-lg mb-2">Analiz Ediliyor...</h3>
          <div className="w-48 h-2 rounded-full bg-secondary overflow-hidden mb-2">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-sm">%{scanProgress}</p>
          <div className="mt-6 space-y-1">
            {scanProgress > 20 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" /> Yemek tespit edildi
              </motion.p>
            )}
            {scanProgress > 50 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" /> Porsiyon analizi tamamlandı
              </motion.p>
            )}
            {scanProgress > 80 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-2">
                <Check className="w-3 h-3 text-green-400" /> Makro hesaplanıyor
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {phase === "results" && (
        <div className="pt-16 pb-24 px-4 h-full overflow-y-auto">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2"
            >
              <Check className="w-6 h-6 text-green-400" />
            </motion.div>
            <h3 className="text-foreground font-display text-lg">{results.length} Yemek Tespit Edildi</h3>
            <p className="text-muted-foreground text-xs mt-1">Eklemek istediklerinizi seçin</p>
          </div>

          <div className="space-y-3">
            {results.map((food, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => toggleFood(index)}
                className={`w-full text-left backdrop-blur-xl bg-card border rounded-xl p-4 transition-all ${
                  selectedFoods.has(index) ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-foreground font-medium text-sm">{food.name}</p>
                    <p className="text-muted-foreground text-xs">{food.portion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">%{food.confidence}</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedFoods.has(index) ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {selectedFoods.has(index) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="text-center">
                    <p className="text-primary text-sm font-bold">{food.calories}</p>
                    <p className="text-muted-foreground text-[10px]">kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 text-sm font-bold">{food.protein}g</p>
                    <p className="text-muted-foreground text-[10px]">protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-orange-400 text-sm font-bold">{food.carbs}g</p>
                    <p className="text-muted-foreground text-[10px]">karb</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-400 text-sm font-bold">{food.fat}g</p>
                    <p className="text-muted-foreground text-[10px]">yağ</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setPhase("camera"); setResults([]); setSelectedFoods(new Set()); }} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                Tekrar Tara
              </Button>
              <Button onClick={addSelected} disabled={selectedFoods.size === 0} className="flex-1 gap-2">
                <Plus className="w-4 h-4" />
                Ekle ({selectedFoods.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NutriScanner;
