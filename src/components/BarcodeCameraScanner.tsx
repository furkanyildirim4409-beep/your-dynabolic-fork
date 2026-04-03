import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ScanBarcode } from "lucide-react";
import { toast } from "sonner";

interface BarcodeCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

const BarcodeCameraScanner = ({ isOpen, onClose, onDetected }: BarcodeCameraScannerProps) => {
  const scannerRef = useRef<any>(null);
  const containerIdRef = useRef(`barcode-scanner-${Date.now()}`);
  const [isStarting, setIsStarting] = useState(false);
  const hasDetectedRef = useRef(false);

  // Stable refs for callback props to avoid re-triggering the effect
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState?.();
        if (state === 2 || state === 3) {
          await scanner.stop();
        }
      } catch {
        // ignore stop errors
      }
      try {
        scanner.clear();
      } catch {
        // ignore clear errors
      }
      scannerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(async () => {
    await stopScanner();
    onCloseRef.current();
  }, [stopScanner]);

  useEffect(() => {
    if (!isOpen) {
      hasDetectedRef.current = false;
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      setIsStarting(true);
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(containerIdRef.current, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);

        const successCb = (decodedText: string) => {
          if (hasDetectedRef.current) return;
          hasDetectedRef.current = true;
          if (navigator.vibrate) navigator.vibrate(100);
          stopScanner().then(() => onDetectedRef.current(decodedText));
        };
        const errorCb = () => {};
        const scanConfig = { fps: isIOS ? 10 : 15 };

        // iOS Safari is strict with constraints — try plain facingMode first,
        // then fall back to no constraints at all.
        const cameraConfigs: any[] = [
          { facingMode: "environment" },
          ...(isAndroid ? [{ facingMode: "environment", aspectRatio: { ideal: 9 / 16 } }] : []),
        ];

        // On Android, prefer the aspectRatio config first
        if (isAndroid) cameraConfigs.reverse();

        let started = false;
        for (const camCfg of cameraConfigs) {
          if (cancelled) return;
          try {
            await scanner.start(camCfg, scanConfig, successCb, errorCb);
            started = true;
            break;
          } catch (attemptErr: any) {
            console.warn("[BarcodeCameraScanner] attempt failed with config:", camCfg, attemptErr?.name, attemptErr?.message);
            // Reset scanner state before retry
            try { await scanner.stop(); } catch { /* ignore */ }
          }
        }

        // Last resort: try with just `true` (any available camera)
        if (!started && !cancelled) {
          try {
            await scanner.start(true, scanConfig, successCb, errorCb);
            started = true;
          } catch (lastErr: any) {
            console.error("[BarcodeCameraScanner] all attempts failed:", lastErr?.name, lastErr?.message);
            throw lastErr;
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("[BarcodeCameraScanner] fatal:", err?.name, err?.message, err);
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "NotFoundError") {
          toast.error("Kamera izni verilmedi veya kamera bulunamadı.");
        } else {
          toast.error(`Kamera başlatılamadı: ${err?.message || "Bilinmeyen hata"}`);
        }
        onCloseRef.current();
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    };

    const timeout = setTimeout(startScanner, 100);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen, stopScanner]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-destructive"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="font-display text-sm text-white tracking-wider uppercase">
                BARKOD TARAYICI
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Camera feed container */}
          <div className="flex-1 relative overflow-hidden">
            {/* html5-qrcode renders video here */}
            <div
              id={containerIdRef.current}
              className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center [&_div]:!border-none [&_div]:!shadow-none [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_canvas]:!hidden"
            />

            {/* Dark overlay with cutout illusion */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Scanning box */}
              <div className="relative w-72 h-44">
                {/* Corner guides - neon green */}
                <div className="absolute -top-1 -left-1 w-10 h-10 border-t-[3px] border-l-[3px] border-[#CCFF00] rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-10 h-10 border-t-[3px] border-r-[3px] border-[#CCFF00] rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-[3px] border-l-[3px] border-[#CCFF00] rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-[3px] border-r-[3px] border-[#CCFF00] rounded-br-lg" />

                {/* Animated scan line */}
                <motion.div
                  className="absolute left-2 right-2 h-0.5 bg-[#CCFF00]/70 shadow-[0_0_8px_#CCFF00]"
                  animate={{ top: ["10%", "90%", "10%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>

          {/* Bottom instruction */}
          <div className="absolute bottom-12 left-0 right-0 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ScanBarcode className="w-5 h-5 text-[#CCFF00]" />
              <p className="text-white/80 text-sm font-medium">
                {isStarting ? "Kamera açılıyor..." : "Barkodu çerçeve içine alın"}
              </p>
            </div>
            <p className="text-white/40 text-xs">EAN-13, EAN-8, UPC desteklenir</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BarcodeCameraScanner;
