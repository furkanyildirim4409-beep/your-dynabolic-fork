import { motion, AnimatePresence } from "framer-motion";

const AchievementUnlockNotification = ({ achievement, onClose }: { achievement: any; onClose: () => void }) => {
  if (!achievement) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-4 right-4 z-[200] mx-auto max-w-sm">
        <button onClick={onClose} className="w-full glass-card p-4 border-primary/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">🏆</div>
          <div className="flex-1 text-left">
            <p className="text-primary text-xs font-medium uppercase tracking-wider">Rozet Açıldı!</p>
            <p className="text-foreground font-display text-sm">{achievement?.name || "Başarım"}</p>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementUnlockNotification;
