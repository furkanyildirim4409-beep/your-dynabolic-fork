import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Plus, Minus, X, Volume2, VolumeX } from "lucide-react";

interface RestTimerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds?: number;
  exerciseName?: string;
  nextExercise?: string;
}

const RestTimerOverlay = ({ isOpen, onClose, initialSeconds = 90, exerciseName, nextExercise }: RestTimerOverlayProps) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
      setIsRunning(true);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, secondsLeft]);

  const togglePause = useCallback(() => setIsRunning((r) => !r), []);
  const reset = useCallback(() => { setSecondsLeft(totalSeconds); setIsRunning(true); }, [totalSeconds]);
  const addTime = useCallback((s: number) => {
    setTotalSeconds((t) => Math.max(10, t + s));
    setSecondsLeft((l) => Math.max(0, l + s));
  }, []);

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const circumference = 2 * Math.PI * 120;
  const isFinished = secondsLeft === 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center"
      >
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
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

        {/* Timer Circle */}
        <div className="relative w-64 h-64 mb-8">
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
              className={`font-display text-6xl font-bold ${isFinished ? "text-primary" : secondsLeft <= 10 ? "text-destructive" : "text-foreground"}`}
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
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addTime(-15)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <Minus className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePause}
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
        <div className="flex gap-2 mb-6">
          {[60, 90, 120, 180].map((sec) => (
            <button
              key={sec}
              onClick={() => { setTotalSeconds(sec); setSecondsLeft(sec); setIsRunning(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                totalSeconds === sec ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {sec < 60 ? `${sec}s` : `${sec / 60}dk`}
            </button>
          ))}
        </div>

        <button onClick={reset} className="flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground transition-colors">
          <RotateCcw className="w-4 h-4" />
          Sıfırla
        </button>

        {/* Skip Rest Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute bottom-8 left-4 right-4 flex items-center justify-center gap-3 bg-secondary/80 hover:bg-secondary px-8 py-4 rounded-2xl border border-border transition-colors"
        >
          <Play className="w-5 h-5 text-primary" />
          <span className="font-display text-foreground tracking-wide">DİNLENMEYİ ATLA</span>
        </motion.button>

        {/* Next exercise preview */}
        {nextExercise && (
          <div className="absolute bottom-8 left-4 right-4">
            <div className="backdrop-blur-xl bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-muted-foreground text-xs">Sıradaki Hareket</p>
              <p className="text-foreground text-sm font-medium mt-0.5">{nextExercise}</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default RestTimerOverlay;
