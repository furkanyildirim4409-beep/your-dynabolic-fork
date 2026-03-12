import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, ImagePlus, X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

const VIEW_LABELS: Record<string, string> = {
  front: "Ön",
  side: "Yan",
  back: "Arka",
};

const VIEWS = ["front", "side", "back"] as const;

interface PhotoSlot {
  file: File | null;
  preview: string | null;
  view: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: { file: File; view: string }[], metadata: { date: string; weight?: number; bodyFatPct?: number; note?: string }) => Promise<void>;
}

const UploadProgressPhotoModal = ({ open, onOpenChange, onUpload }: Props) => {
  const [step, setStep] = useState<"photos" | "confirm">("photos");
  const [slots, setSlots] = useState<PhotoSlot[]>(
    VIEWS.map((v) => ({ file: null, preview: null, view: v }))
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filledCount = slots.filter((s) => s.file !== null).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSlots((prev) =>
        prev.map((s, i) =>
          i === activeSlot ? { ...s, file: f, preview: ev.target?.result as string } : s
        )
      );
    };
    reader.readAsDataURL(f);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeSlot = (index: number) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, file: null, preview: null } : s))
    );
  };

  const reset = () => {
    setStep("photos");
    setSlots(VIEWS.map((v) => ({ file: null, preview: null, view: v })));
    setActiveSlot(0);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setWeight("");
    setBodyFat("");
    setNote("");
  };

  const handleSubmit = async () => {
    const filledSlots = slots.filter((s) => s.file !== null) as { file: File; preview: string; view: string }[];
    if (filledSlots.length === 0) return;

    setUploading(true);
    try {
      await onUpload(
        filledSlots.map((s) => ({ file: s.file, view: s.view })),
        {
          date,
          weight: weight ? parseFloat(weight) : undefined,
          bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
          note: note || undefined,
        }
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    // Small delay to ensure state is set before input click
    setTimeout(() => inputRef.current?.click(), 50);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-md bg-card border-border p-0 overflow-hidden">
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

        <AnimatePresence mode="wait">
          {step === "photos" ? (
            <motion.div
              key="photos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">
                  Gelişim Fotoğrafları
                </DialogTitle>
                <p className="text-muted-foreground text-xs mt-1">
                  3 açıdan fotoğraf ekleyin (en az 1 zorunlu)
                </p>
              </DialogHeader>

              {/* 3 photo slots */}
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot, i) => (
                  <div key={slot.view} className="space-y-1.5">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest text-center font-display">
                      {VIEW_LABELS[slot.view]}
                    </p>
                    <button
                      type="button"
                      onClick={() => triggerFileInput(i)}
                      className={`relative w-full aspect-[3/4] rounded-xl border-2 border-dashed overflow-hidden transition-all flex items-center justify-center ${
                        slot.preview
                          ? "border-primary/30 bg-secondary/20"
                          : "border-border bg-secondary/30 hover:border-primary/50"
                      }`}
                    >
                      {slot.preview ? (
                        <>
                          <img src={slot.preview} alt={VIEW_LABELS[slot.view]} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive/90 flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-destructive-foreground" />
                          </button>
                          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ImagePlus className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground text-[10px]">Ekle</span>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-1.5">
                {slots.map((s, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      s.file ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
                <span className="text-muted-foreground text-xs ml-2">{filledCount}/3</span>
              </div>

              <Button
                onClick={() => setStep("confirm")}
                disabled={filledCount === 0}
                className="w-full h-11 font-display gap-2"
              >
                Devam Et <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6 space-y-4"
            >
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep("photos")}
                    className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <DialogTitle className="font-display text-foreground">
                    Bilgileri Tamamla
                  </DialogTitle>
                </div>
              </DialogHeader>

              {/* Preview strip of selected photos */}
              <div className="flex gap-2 justify-center">
                {slots.filter((s) => s.preview).map((s) => (
                  <div key={s.view} className="relative">
                    <img
                      src={s.preview!}
                      alt={VIEW_LABELS[s.view]}
                      className="w-16 h-20 rounded-lg object-cover border border-border"
                    />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[8px] font-display">
                      {VIEW_LABELS[s.view]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Metadata fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Tarih</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kilo (kg)</Label>
                  <Input type="number" step="0.1" placeholder="80.0" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Yağ Oranı (%)</Label>
                  <Input type="number" step="0.1" placeholder="15.0" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Not</Label>
                  <Input placeholder="Ör: Başlangıç fotoğrafı" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={uploading} className="w-full h-11 font-display">
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yükleniyor ({filledCount} fotoğraf)...</>
                ) : (
                  <><Camera className="w-4 h-4 mr-2" /> {filledCount} Fotoğraf Yükle</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProgressPhotoModal;
