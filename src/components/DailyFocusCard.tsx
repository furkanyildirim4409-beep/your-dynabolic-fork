import { motion } from "framer-motion";
import { Target, ChevronRight, Zap } from "lucide-react";

interface DailyFocusCardProps {
  title?: string;
  subtitle?: string;
  progress?: number;
  onAction?: () => void;
}

const DailyFocusCard = ({
  title = "GÖĞÜS & SIRT",
  subtitle = "Arnold Split - Gün 1",
  progress = 0,
  onAction,
}: DailyFocusCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onAction}
      className="w-full backdrop-blur-xl bg-card border border-border rounded-xl p-4 text-left group hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Bugünkü Odak</p>
            <p className="text-foreground font-display text-sm font-bold tracking-wide">{title}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
      </div>

      <p className="text-muted-foreground text-xs mb-3">{subtitle}</p>

      {/* Progress */}
      {progress > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">İlerleme</span>
            <span className="text-primary font-medium">%{progress}</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
            />
          </div>
        </div>
      )}

      {progress === 0 && (
        <div className="flex items-center gap-2 text-primary text-xs font-medium">
          <Zap className="w-3.5 h-3.5" />
          Antrenmana Başla
        </div>
      )}
    </motion.button>
  );
};

export default DailyFocusCard;
