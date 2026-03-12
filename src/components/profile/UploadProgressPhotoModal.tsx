import { useState, useRef } from "react";
import { Camera, Loader2, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, metadata: { date: string; weight?: number; bodyFatPct?: number; note?: string }) => Promise<void>;
}

const UploadProgressPhotoModal = ({ open, onOpenChange, onUpload }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setDate(format(new Date(), "yyyy-MM-dd"));
    setWeight("");
    setBodyFat("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file, {
        date,
        weight: weight ? parseFloat(weight) : undefined,
        bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
        note: note || undefined,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Gelişim Fotoğrafı Ekle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo picker */}
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center gap-3 overflow-hidden transition-colors hover:border-primary/50"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="w-7 h-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-foreground text-sm font-medium">Fotoğraf Seç veya Çek</p>
                  <p className="text-muted-foreground text-xs mt-1">JPG, PNG • maks. 10MB</p>
                </div>
              </>
            )}
          </button>

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

          <Button onClick={handleSubmit} disabled={!file || uploading} className="w-full h-11 font-display">
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yükleniyor...</> : <><Camera className="w-4 h-4 mr-2" /> Yükle</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProgressPhotoModal;
