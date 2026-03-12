import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, ChevronDown, ChevronUp, Beaker, Activity, Heart, Pill, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BloodTestUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, date: string) => Promise<void>;
}

const recommendedTests = [
  {
    category: "Hormonlar",
    icon: Activity,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    tests: ["Testosteron", "Kortizol", "TSH"],
  },
  {
    category: "Organ & Metabolizma",
    icon: Heart,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    tests: ["Kreatinin", "AST", "ALT", "Üre"],
  },
  {
    category: "Toparlanma",
    icon: Beaker,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    tests: ["CRP", "Kreatin Kinaz (CK)"],
  },
  {
    category: "Vitamin & Mineraller",
    icon: Pill,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    tests: ["Vitamin D", "B12", "Ferritin", "Magnezyum"],
  },
];

const BloodTestUploaderModal = ({ isOpen, onClose, onUpload }: BloodTestUploaderModalProps) => {
  const [guideExpanded, setGuideExpanded] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.includes("image")) return;
    setIsParsing(true);
    await onUpload(file, format(selectedDate, "yyyy-MM-dd"));
    setIsParsing(false);
    onClose();
  }, [onUpload, selectedDate, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="min-h-screen bg-background pt-4 pb-24"
        >
          {/* Header */}
          <div className="px-4 flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold text-foreground">Kan Tahlili Yükle</h2>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Info Guide */}
          <div className="mx-4 mb-6">
            <button
              onClick={() => setGuideExpanded(!guideExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-2">
                <Beaker className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Sporcular İçin Önerilen Testler</span>
              </div>
              {guideExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
              {guideExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {recommendedTests.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <div key={cat.category} className={`p-3 rounded-xl border border-border ${cat.bgColor}`}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                            <span className={`text-xs font-semibold ${cat.color}`}>{cat.category}</span>
                          </div>
                          <div className="space-y-0.5">
                            {cat.tests.map((t) => (
                              <p key={t} className="text-xs text-muted-foreground">• {t}</p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date Picker */}
          <div className="mx-4 mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Tahlil Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "dd MMMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Upload Zone */}
          <div className="mx-4">
            {isParsing ? (
              <div className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-primary/30 bg-primary/5">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium text-foreground">PDF analiz ediliyor...</p>
                <p className="text-xs text-muted-foreground mt-1">Biyobelirteçler çıkarılıyor</p>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">PDF veya görsel sürükleyin</p>
                <p className="text-xs text-muted-foreground mt-1">veya tıklayarak seçin</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BloodTestUploaderModal;
