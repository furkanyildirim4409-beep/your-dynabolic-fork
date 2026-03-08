import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import { useOfflineMode } from "@/context/OfflineContext";

const OfflineBanner = () => {
  const { isOffline } = useOfflineMode();
  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500/90 backdrop-blur-sm">
          <div className="max-w-[430px] mx-auto px-4 py-2 flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 text-yellow-900" />
            <span className="text-yellow-900 text-xs font-medium">Çevrimdışı - Önbellek Verileri Kullanılıyor</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
