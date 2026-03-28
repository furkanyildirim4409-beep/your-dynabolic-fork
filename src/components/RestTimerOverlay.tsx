import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Minus, X, Volume2, VolumeX } from "lucide-react";
import { useStableTimer } from "@/hooks/useStableTimer";
import { useState } from "react";
import { hapticLight, hapticMedium, hapticHeavy } from "@/lib/haptics";
import { playCompletionBeep } from "@/lib/audio";

interface RestTimerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
  exerciseName?: string;
  nextExercise?: string;
}

const RestTimerOverlay = ({ isOpen, onClose, initialSeconds = 90, exerciseName, nextExercise }: RestTimerOverlayProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const handleBeforeComplete = useCallback(() => {
    if (soundEnabledRef.current) {
      playCompletionBeep();
    }
    hapticHeavy();
  }, []);

  const { seconds: secondsLeft, isRunning, toggle, reset, addTime, setInitial } = useStableTimer({
    mode: "down",
    initialSeconds,
    autoStart: isOpen,
    onComplete: onClose,
    onBeforeComplete: handleBeforeComplete,
  });

  const totalSeconds = initialSeconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const circumference = 2 * Math.PI * 120;
  const isFinished = secondsLeft === 0;

  // Haptic feedback for last 3 seconds
  const lastHapticRef = useRef<number>(-1);
  useEffect(() => {
    if (secondsLeft <= 3 && secondsLeft > 0 && secondsLeft !== lastHapticRef.current) {
      lastHapticRef.current = secondsLeft;
      if (secondsLeft === 3) hapticLight();
      else if (secondsLeft === 2) hapticMedium();
      else if (secondsLeft === 1) hapticHeavy();
    }
  }, [secondsLeft]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center overflow-y-auto"
      >
        {/* Header */}
        <div className="flex-shrink-0 w-full px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Dinlenme</p>
            {exerciseName && <p className="text-foreground text-sm font-medium">{exerciseName}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-full bg-secondary">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Spacer to push timer toward center */}
        <div className="flex-1 min-h-4" />

        {/* Timer Circle */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex-shrink-0 mb-6">
          <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90">
            <circle cx="130" cy="130" r="120" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <motion.circle
              cx="130" cy="130" r="120" fill="none"
              stroke={isFinished ? "hsl(var(--primary))" : secondsLeft <= 10 ? "hsl(0 84% 60%)" : "hsl(var(--primary))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={secondsLeft}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`font-display text-5xl sm:text-6xl font-bold ${isFinished ? "text-primary" : secondsLeft <= 10 ? "text-destructive" : "text-foreground"}`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </motion.span>
            {isFinished && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary text-sm font-medium mt-1"
              >
                Hazırsın! 💪
              </motion.p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addTime(-15)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <Minus className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggle}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
          >
            {isRunning ? <Pause className="w-7 h-7 text-primary-foreground" /> : <Play className="w-7 h-7 text-primary-foreground ml-0.5" />}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addTime(30)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          {[60, 90, 120, 180].map((sec) => (
            <button
              key={sec}
              onClick={() => setInitial(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                totalSeconds === sec ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {sec < 60 ? `${sec}s` : `${sec / 60}dk`}
            </button>
          ))}
        </div>

        <button onClick={() => reset()} className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors flex-shrink-0">
          <RotateCcw className="w-4 h-4" />
          Sıfırla
        </button>

        {/* Next exercise preview */}
        {nextExercise && (
          <div className="mt-4 w-[85%] max-w-sm flex-shrink-0">
            <div className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-muted-foreground text-xs">Sıradaki Hareket</p>
              <p className="text-foreground text-sm font-medium mt-0.5">{nextExercise}</p>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-4" />

        {/* Skip Rest Button — pushed to bottom */}
        <div className="flex-shrink-0 w-full px-4 pb-8 safe-bottom">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full flex items-center justify-center gap-3 bg-secondary/80 hover:bg-secondary px-8 py-4 rounded-2xl border border-border transition-colors"
          >
            <Play className="w-5 h-5 text-primary" />
            <span className="font-display text-foreground tracking-wide">DİNLENMEYİ ATLA</span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimerOverlay;
