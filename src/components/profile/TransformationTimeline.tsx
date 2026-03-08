import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X, Calendar, TrendingDown, Scale, Ruler, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TransformationPhoto {
  id: string;
  url: string;
  date: string;
  weight: number;
  bodyFat?: number;
  note?: string;
  view: "front" | "side" | "back";
}

const mockPhotos: TransformationPhoto[] = [
  { id: "t1", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop", date: "2025-06-15", weight: 92, bodyFat: 22, note: "Başlangıç", view: "front" },
  { id: "t2", url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop", date: "2025-08-15", weight: 88, bodyFat: 19, note: "2. Ay", view: "front" },
  { id: "t3", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=600&fit=crop", date: "2025-10-15", weight: 85, bodyFat: 17, note: "4. Ay", view: "front" },
  { id: "t4", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=600&fit=crop", date: "2025-12-15", weight: 82, bodyFat: 15, note: "6. Ay", view: "front" },
  { id: "t5", url: "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=400&h=600&fit=crop", date: "2026-02-15", weight: 80, bodyFat: 13, note: "8. Ay - Şimdi", view: "front" },
];

type CompareMode = "slider" | "sideBySide" | "overlay";

const TransformationTimeline = () => {
  const [photos] = useState<TransformationPhoto[]>(mockPhotos);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compareMode, setCompareMode] = useState<CompareMode>("slider");
  const [compareLeftIndex, setCompareLeftIndex] = useState(0);
  const [compareRightIndex, setCompareRightIndex] = useState(photos.length - 1);
  const [showCompare, setShowCompare] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR", { month: "short", year: "numeric" });

  const handleSliderDrag = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(5, Math.min(95, pos)));
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      handleSliderDrag(clientX);
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [handleSliderDrag]);

  const selectedPhoto = photos[selectedIndex];
  const leftPhoto = photos[compareLeftIndex];
  const rightPhoto = photos[compareRightIndex];

  const totalWeightLoss = photos[0].weight - photos[photos.length - 1].weight;
  const totalFatLoss = (photos[0].bodyFat || 0) - (photos[photos.length - 1].bodyFat || 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-foreground text-base tracking-wide">DÖNÜŞÜM</h3>
          <p className="text-muted-foreground text-xs">{photos.length} fotoğraf • {totalWeightLoss}kg kayıp</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCompare(!showCompare)} className="h-8 text-xs border-border">
          {showCompare ? "Zaman Çizelgesi" : "Karşılaştır"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <Scale className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-foreground font-display text-sm">-{totalWeightLoss}kg</p>
          <p className="text-muted-foreground text-[9px]">KİLO</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <TrendingDown className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-foreground font-display text-sm">-{totalFatLoss}%</p>
          <p className="text-muted-foreground text-[9px]">YAĞ</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border text-center">
          <Calendar className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-foreground font-display text-sm">8 Ay</p>
          <p className="text-muted-foreground text-[9px]">SÜRE</p>
        </div>
      </div>

      {!showCompare ? (
        /* Timeline view */
        <div className="space-y-3">
          {/* Main photo */}
          <motion.div
            key={selectedIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden bg-secondary aspect-[3/4] cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          >
            <img src={selectedPhoto.url} alt={selectedPhoto.note} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent p-4">
              <p className="text-foreground font-display text-sm">{selectedPhoto.note}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-muted-foreground text-xs">{formatDate(selectedPhoto.date)}</span>
                <span className="text-primary text-xs font-medium">{selectedPhoto.weight}kg</span>
                {selectedPhoto.bodyFat && <span className="text-muted-foreground text-xs">%{selectedPhoto.bodyFat} yağ</span>}
              </div>
            </div>
            <button className="absolute top-3 right-3 p-2 rounded-full bg-background/50 backdrop-blur-sm">
              <Maximize2 className="w-4 h-4 text-foreground" />
            </button>
          </motion.div>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden transition-all ${
                  index === selectedIndex ? "ring-2 ring-primary scale-105" : "opacity-60"
                }`}
              >
                <img src={photo.url} alt={photo.note} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-background/70 py-0.5">
                  <p className="text-foreground text-[8px] text-center font-medium">{formatDate(photo.date)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Compare mode */
        <div className="space-y-3">
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
            {([["slider", "Slider"], ["sideBySide", "Yan Yana"], ["overlay", "Üst Üste"]] as [CompareMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setCompareMode(mode)}
                className={`flex-1 py-2 rounded-lg text-xs font-display transition-all ${
                  compareMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Compare view */}
          <div ref={containerRef} className="relative rounded-2xl overflow-hidden bg-secondary aspect-[3/4]" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
            {compareMode === "slider" && (
              <div ref={sliderRef} className="relative w-full h-full">
                <img src={rightPhoto.url} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                  <img src={leftPhoto.url} alt="Before" className="w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }} />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-primary cursor-col-resize z-10"
                  style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                  onMouseDown={() => { isDragging.current = true; }}
                  onTouchStart={() => { isDragging.current = true; }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <GripVertical className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">
                  {formatDate(leftPhoto.date)}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">
                  {formatDate(rightPhoto.date)}
                </div>
              </div>
            )}

            {compareMode === "sideBySide" && (
              <div className="flex w-full h-full">
                <div className="relative w-1/2 h-full border-r border-border">
                  <img src={leftPhoto.url} alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">
                    {formatDate(leftPhoto.date)} • {leftPhoto.weight}kg
                  </div>
                </div>
                <div className="relative w-1/2 h-full">
                  <img src={rightPhoto.url} alt="After" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">
                    {formatDate(rightPhoto.date)} • {rightPhoto.weight}kg
                  </div>
                </div>
              </div>
            )}

            {compareMode === "overlay" && (
              <div className="relative w-full h-full">
                <img src={leftPhoto.url} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                <img src={rightPhoto.url} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: overlayOpacity / 100 }} />
                <div className="absolute bottom-3 left-3 right-3">
                  <Slider value={[overlayOpacity]} onValueChange={([v]) => setOverlayOpacity(v)} min={0} max={100} step={1} className="w-full" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-foreground/60 font-display">{formatDate(leftPhoto.date)}</span>
                    <span className="text-[10px] text-foreground/60 font-display">{formatDate(rightPhoto.date)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photo selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1.5">Önce</p>
              <div className="flex gap-1.5 overflow-x-auto">
                {photos.map((p, i) => (
                  <button key={p.id} onClick={() => setCompareLeftIndex(i)} className={`flex-shrink-0 w-12 h-14 rounded-lg overflow-hidden transition-all ${i === compareLeftIndex ? "ring-2 ring-primary" : "opacity-50"}`}>
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1.5">Sonra</p>
              <div className="flex gap-1.5 overflow-x-auto">
                {photos.map((p, i) => (
                  <button key={p.id} onClick={() => setCompareRightIndex(i)} className={`flex-shrink-0 w-12 h-14 rounded-lg overflow-hidden transition-all ${i === compareRightIndex ? "ring-2 ring-primary" : "opacity-50"}`}>
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="p-2 rounded-full bg-secondary">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-muted-foreground text-xs font-display">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 rounded-full bg-secondary">
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex items-center justify-center" onClick={() => setShowFullscreen(false)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-secondary z-10"><X className="w-5 h-5 text-foreground" /></button>
            <img src={selectedPhoto.url} alt={selectedPhoto.note} className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(i => Math.max(0, i - 1)); }} className="p-3 rounded-full bg-secondary/80 backdrop-blur-sm"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(i => Math.min(photos.length - 1, i + 1)); }} className="p-3 rounded-full bg-secondary/80 backdrop-blur-sm"><ChevronRight className="w-5 h-5 text-foreground" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransformationTimeline;
