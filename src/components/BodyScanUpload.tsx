import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Upload, RotateCcw, Check, ChevronRight, User, Ruler, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

type ScanView = "front" | "side" | "back";
type ScanStep = "select" | "capture" | "review" | "processing" | "complete";

interface ScanPhoto {
  view: ScanView;
  url: string;
  timestamp: Date;
}

interface BodyScanUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

const viewConfig: Record<ScanView, { label: string; description: string; icon: string }> = {
  front: { label: "Ön Görünüm", description: "Kollar yanda, düz duruş", icon: "👤" },
  side: { label: "Yan Görünüm", description: "Sol yan, doğal duruş", icon: "🧍" },
  back: { label: "Arka Görünüm", description: "Kollar yanda, düz duruş", icon: "🔙" },
};

const BodyScanUpload = ({ isOpen, onClose }: BodyScanUploadProps) => {
  const [step, setStep] = useState<ScanStep>("select");
  const [currentView, setCurrentView] = useState<ScanView>("front");
  const [photos, setPhotos] = useState<ScanPhoto[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Hata", description: "Sadece resim dosyaları yüklenebilir.", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep("review");
  };

  const handleConfirmPhoto = () => {
    if (!previewUrl) return;
    setPhotos(prev => [...prev.filter(p => p.view !== currentView), { view: currentView, url: previewUrl, timestamp: new Date() }]);
    setPreviewUrl(null);

    const views: ScanView[] = ["front", "side", "back"];
    const currentIdx = views.indexOf(currentView);
    if (currentIdx < views.length - 1) {
      setCurrentView(views[currentIdx + 1]);
      setStep("select");
    } else {
      setStep("processing");
      simulateProcessing();
    }
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStep("select");
  };

  const simulateProcessing = () => {
    setProcessingProgress(0);
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep("complete");
          toast({ title: "Tarama Tamamlandı! 🎉", description: "Vücut analizi başarıyla oluşturuldu." });
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  const handleReset = () => {
    photos.forEach(p => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setPreviewUrl(null);
    setStep("select");
    setCurrentView("front");
    setProcessingProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const completedViews = photos.map(p => p.view);
  const allViews: ScanView[] = ["front", "side", "back"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 h-[100dvh] bg-background/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-display text-foreground text-base tracking-wide">VÜCUT TARAMASI</h2>
            <p className="text-muted-foreground text-xs">3 açıdan fotoğraf yükleyin</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 py-4">
          {allViews.map((view) => (
            <div key={view} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                completedViews.includes(view) ? "bg-primary text-primary-foreground" :
                view === currentView && step !== "complete" ? "bg-primary/20 text-primary ring-2 ring-primary" :
                "bg-secondary text-muted-foreground"
              }`}>
                {completedViews.includes(view) ? <Check className="w-4 h-4" /> : viewConfig[view].icon}
              </div>
              {view !== "back" && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {/* SELECT step */}
          {step === "select" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl">
                  {viewConfig[currentView].icon}
                </div>
                <h3 className="font-display text-foreground text-lg">{viewConfig[currentView].label}</h3>
                <p className="text-muted-foreground text-sm mt-1">{viewConfig[currentView].description}</p>
              </div>

              {/* Tips */}
              <div className="space-y-2">
                {[
                  { icon: Ruler, text: "Kameradan 2-3 metre uzakta durun" },
                  { icon: User, text: "Düz bir arka plan tercih edin" },
                  { icon: AlertCircle, text: "İyi aydınlatma kullanın" },
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                    <tip.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground text-xs">{tip.text}</p>
                  </div>
                ))}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

              <div className="flex gap-3">
                <Button onClick={() => fileInputRef.current?.click()} className="flex-1 h-14 bg-primary hover:bg-primary/90 font-display tracking-wider">
                  <Camera className="w-5 h-5 mr-2" /> FOTOĞRAF ÇEK
                </Button>
                <Button variant="outline" onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.onchange = (e) => handleFileSelect(e as any); input.click(); }} className="h-14 px-4 border-border">
                  <Upload className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* REVIEW step */}
          {step === "review" && previewUrl && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-[3/4]">
                <img src={previewUrl} alt={viewConfig[currentView].label} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm">
                  <p className="text-foreground text-xs font-display">{viewConfig[currentView].label}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetake} className="flex-1 h-12 border-border">
                  <RotateCcw className="w-4 h-4 mr-2" /> Tekrar Çek
                </Button>
                <Button onClick={handleConfirmPhoto} className="flex-1 h-12 bg-primary hover:bg-primary/90 font-display">
                  <Check className="w-4 h-4 mr-2" /> ONAYLA
                </Button>
              </div>
            </motion.div>
          )}

          {/* PROCESSING step */}
          {step === "processing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 space-y-6">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary" />
              <div className="text-center">
                <h3 className="font-display text-foreground text-lg mb-1">Analiz Ediliyor</h3>
                <p className="text-muted-foreground text-sm">Yapay zeka vücudunuzu analiz ediyor...</p>
              </div>
              <div className="w-full max-w-xs">
                <Progress value={Math.min(processingProgress, 100)} className="h-2" />
                <p className="text-muted-foreground text-xs text-center mt-2">{Math.min(Math.round(processingProgress), 100)}%</p>
              </div>
            </motion.div>
          )}

          {/* COMPLETE step */}
          {step === "complete" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-8">
              <div className="text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }} className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-primary" />
                </motion.div>
                <h3 className="font-display text-foreground text-lg">Tarama Tamamlandı!</h3>
                <p className="text-muted-foreground text-sm mt-1">Sonuçlarınız profilinize eklendi.</p>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <div key={photo.view} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-secondary">
                    <img src={photo.url} alt={viewConfig[photo.view].label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/80 to-transparent p-2">
                      <p className="text-foreground text-[10px] font-display text-center">{viewConfig[photo.view].label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mock measurements */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Göğüs", value: "102 cm" },
                  { label: "Bel", value: "82 cm" },
                  { label: "Kalça", value: "98 cm" },
                  { label: "Kol", value: "38 cm" },
                  { label: "Uyluk", value: "58 cm" },
                  { label: "Vücut Yağı", value: "~16%" },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-xl bg-card border border-border text-center">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest">{m.label}</p>
                    <p className="text-foreground font-display text-lg mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1 h-12 border-border">
                  <RotateCcw className="w-4 h-4 mr-2" /> Yeniden Tara
                </Button>
                <Button onClick={handleClose} className="flex-1 h-12 bg-primary hover:bg-primary/90 font-display">
                  TAMAM
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BodyScanUpload;
