import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X, Calendar, TrendingDown, Scale, GripVertical, Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTransformationStats } from "@/hooks/useTransformationStats";
import { useProgressPhotos, ProgressPhoto } from "@/hooks/useProgressPhotos";
import UploadProgressPhotoModal from "./UploadProgressPhotoModal";

type CompareMode = "slider" | "sideBySide" | "overlay";

const TransformationTimeline = () => {
  const { photos, loading: photosLoading, uploadPhoto, deletePhoto } = useProgressPhotos();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compareMode, setCompareMode] = useState<CompareMode>("slider");
  const [compareLeftIndex, setCompareLeftIndex] = useState(0);
  const [compareRightIndex, setCompareRightIndex] = useState(0);
  const [showCompare, setShowCompare] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const { weightDiff, fatDiff, timeElapsed, hasEnoughData, loading: statsLoading } = useTransformationStats();

  // Keep compareRightIndex in sync with photos length
  useEffect(() => {
    if (photos.length > 0) {
      setCompareRightIndex(photos.length - 1);
      if (selectedIndex >= photos.length) setSelectedIndex(photos.length - 1);
    }
  }, [photos.length, selectedIndex]);

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

  const selectedPhoto = photos[selectedIndex] as ProgressPhoto | undefined;
  const leftPhoto = photos[compareLeftIndex] as ProgressPhoto | undefined;
  const rightPhoto = photos[compareRightIndex] as ProgressPhoto | undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-foreground text-base tracking-wide">DÖNÜŞÜM</h3>
          <p className="text-muted-foreground text-xs">
            {hasEnoughData
              ? `${weightDiff ?? "—"} • ${timeElapsed ?? ""}`
              : `${photos.length} fotoğraf`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)} className="h-8 text-xs border-border gap-1">
            <Plus className="w-3.5 h-3.5" /> Ekle
          </Button>
          {photos.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setShowCompare(!showCompare)} className="h-8 text-xs border-border">
              {showCompare ? "Zaman Çizelgesi" : "Karşılaştır"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="p-3 rounded-xl bg-card border border-border animate-pulse h-16" />
          ))}
        </div>
      ) : hasEnoughData ? (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Scale className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-foreground font-display text-sm">{weightDiff ?? "—"}</p>
            <p className="text-muted-foreground text-[9px]">KİLO</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <TrendingDown className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-foreground font-display text-sm">{fatDiff ?? "—"}</p>
            <p className="text-muted-foreground text-[9px]">YAĞ</p>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border text-center">
            <Calendar className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-foreground font-display text-sm">{timeElapsed ?? "—"}</p>
            <p className="text-muted-foreground text-[9px]">SÜRE</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground text-sm font-medium">Henüz yeterli veri yok</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Dönüşümünüzü analiz etmek için en az 2 farklı tarihte vücut ölçümünüzü kaydetmelisiniz.
            </p>
          </div>
        </motion.div>
      )}

      {/* Photo content */}
      {photosLoading ? (
        <div className="aspect-[3/4] rounded-2xl bg-secondary animate-pulse" />
      ) : photos.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-card/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4 cursor-pointer"
          onClick={() => setShowUploadModal(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center px-6">
            <p className="text-foreground font-display text-sm">İlk gelişim fotoğrafınızı yükleyin</p>
            <p className="text-muted-foreground text-xs mt-1">Dönüşümünüzü takip etmek için fotoğraf ekleyin</p>
          </div>
          <Button size="sm" variant="outline" className="border-border gap-1">
            <Plus className="w-3.5 h-3.5" /> Fotoğraf Ekle
          </Button>
        </motion.div>
      ) : !showCompare ? (
        /* Timeline view */
        <div className="space-y-3">
          {selectedPhoto && (
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden bg-secondary aspect-[3/4] cursor-pointer"
              onClick={() => setShowFullscreen(true)}
            >
              <img src={selectedPhoto.photo_url} alt={selectedPhoto.note ?? ""} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent p-4">
                <p className="text-foreground font-display text-sm">{selectedPhoto.note || formatDate(selectedPhoto.date)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-muted-foreground text-xs">{formatDate(selectedPhoto.date)}</span>
                  {selectedPhoto.weight && <span className="text-primary text-xs font-medium">{selectedPhoto.weight}kg</span>}
                  {selectedPhoto.body_fat_pct && <span className="text-muted-foreground text-xs">%{selectedPhoto.body_fat_pct} yağ</span>}
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  className="p-2 rounded-full bg-background/50 backdrop-blur-sm"
                  onClick={(e) => { e.stopPropagation(); deletePhoto(selectedPhoto.id, selectedPhoto.photo_url); }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
                <button className="p-2 rounded-full bg-background/50 backdrop-blur-sm">
                  <Maximize2 className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </motion.div>
          )}

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
                <img src={photo.photo_url} alt={photo.note ?? ""} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-background/70 py-0.5">
                  <p className="text-foreground text-[8px] text-center font-medium">{formatDate(photo.date)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Compare mode */
        leftPhoto && rightPhoto && (
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
            <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-[3/4]" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
              {compareMode === "slider" && (
                <div ref={sliderRef} className="relative w-full h-full">
                  <img src={rightPhoto.photo_url} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                    <img src={leftPhoto.photo_url} alt="Before" className="w-full h-full object-cover" style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }} />
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
                    <img src={leftPhoto.photo_url} alt="Before" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">
                      {formatDate(leftPhoto.date)} {leftPhoto.weight && `• ${leftPhoto.weight}kg`}
                    </div>
                  </div>
                  <div className="relative w-1/2 h-full">
                    <img src={rightPhoto.photo_url} alt="After" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">
                      {formatDate(rightPhoto.date)} {rightPhoto.weight && `• ${rightPhoto.weight}kg`}
                    </div>
                  </div>
                </div>
              )}

              {compareMode === "overlay" && (
                <div className="relative w-full h-full">
                  <img src={leftPhoto.photo_url} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                  <img src={rightPhoto.photo_url} alt="After" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: overlayOpacity / 100 }} />
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
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1.5">Sonra</p>
                <div className="flex gap-1.5 overflow-x-auto">
                  {photos.map((p, i) => (
                    <button key={p.id} onClick={() => setCompareRightIndex(i)} className={`flex-shrink-0 w-12 h-14 rounded-lg overflow-hidden transition-all ${i === compareRightIndex ? "ring-2 ring-primary" : "opacity-50"}`}>
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
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
        )
      )}

      {/* Fullscreen modal */}
      <AnimatePresence>
        {showFullscreen && selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex items-center justify-center" onClick={() => setShowFullscreen(false)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-secondary z-10"><X className="w-5 h-5 text-foreground" /></button>
            <img src={selectedPhoto.photo_url} alt={selectedPhoto.note ?? ""} className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(i => Math.max(0, i - 1)); }} className="p-3 rounded-full bg-secondary/80 backdrop-blur-sm"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedIndex(i => Math.min(photos.length - 1, i + 1)); }} className="p-3 rounded-full bg-secondary/80 backdrop-blur-sm"><ChevronRight className="w-5 h-5 text-foreground" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <UploadProgressPhotoModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUpload={uploadPhoto}
      />
    </div>
  );
};

export default TransformationTimeline;
