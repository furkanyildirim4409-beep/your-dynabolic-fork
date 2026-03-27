import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, ZoomIn } from "lucide-react";

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.9
    );
  });
}

const AvatarCropperModal = ({ isOpen, imageSrc, onClose, onCropComplete }: AvatarCropperModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState([1]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch (e) {
      console.error("Crop failed", e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-background border-primary/20">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-display text-lg">Fotoğrafı Kırp</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-[350px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom[0]}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={(z) => setZoom([z])}
            onCropComplete={onCropCompleteInternal}
          />
        </div>

        <div className="px-6 py-3 flex items-center gap-3">
          <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={zoom}
            onValueChange={setZoom}
            min={1}
            max={3}
            step={0.05}
            className="flex-1"
          />
        </div>

        <DialogFooter className="p-4 pt-2 gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            İptal
          </Button>
          <Button onClick={handleConfirm} disabled={processing} className="neon-glow-sm">
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Onayla ve Kırp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropperModal;
