import { motion } from "framer-motion";
import { Timer, SkipForward, Volume2, Dumbbell, ArrowRight, Plus } from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import { toast } from "sonner";
import { useStableTimer } from "@/hooks/useStableTimer";
import { useEffect, useRef } from "react";

interface ExerciseRestTimerOverlayProps {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
  completedExerciseName: string;
  nextExerciseName: string;
  nextExerciseSets: number;
  nextExerciseReps: number;
  currentExerciseNumber: number;
  totalExercises: number;
}

const ExerciseRestTimerOverlay = ({
  duration,
  onComplete,
  onSkip,
  completedExerciseName,
  nextExerciseName,
  nextExerciseSets,
  nextExerciseReps,
  currentExerciseNumber,
  totalExercises,
}: ExerciseRestTimerOverlayProps) => {
  const { seconds: timeLeft, addTime } = useStableTimer({
    mode: "down",
    initialSeconds: duration,
    autoStart: true,
    onComplete,
  });

  const totalDuration = duration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Sound effects for countdown
  const lastPlayedRef = useRef<number>(-1);
  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0 && timeLeft !== lastPlayedRef.current) {
      lastPlayedRef.current = timeLeft;
      playSound(600, 0.1);
    }
  }, [timeLeft]);

  const playSound = (frequency: number, dur: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + dur);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + dur);
    } catch (e) {
      // Audio not supported
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAdd30Seconds = () => {
    hapticLight();
    addTime(30);
    toast.success("+30 saniye eklendi", { duration: 1500 });
  };

  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center"
    >
      {/* Background Pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-8 left-0 right-0 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-primary mb-2">
          <Timer className="w-5 h-5" />
          <span className="font-display text-sm tracking-wider">HAREKET ARASI DİNLENME</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Hareket {currentExerciseNumber} / {totalExercises} tamamlandı
        </p>
      </motion.div>

      {/* Completed Exercise */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-28 text-center"
      >
        <p className="text-muted-foreground text-xs mb-1">Tamamlanan:</p>
        <p className="text-foreground/60 font-display text-sm line-through">{completedExerciseName}</p>
      </motion.div>

      {/* Circular Timer */}
      <div className="relative mt-8">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 60px hsl(var(--primary) / 0.3), 0 0 120px hsl(var(--primary) / 0.1)`,
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <svg width="240" height="240" className="transform -rotate-90">
          <circle cx="120" cy="120" r="100" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <motion.circle
            cx="120" cy="120" r="100" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
            style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.5))" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-display text-5xl ${timeLeft <= 3 ? "text-destructive" : "text-foreground"}`}
            style={{
              textShadow: timeLeft <= 3
                ? "0 0 20px hsl(var(--destructive) / 0.5)"
                : "0 0 20px hsl(var(--primary) / 0.3)",
            }}
          >
            {formatTime(timeLeft)}
          </motion.span>
          <span className="text-muted-foreground text-xs mt-1">kalan süre</span>
        </div>
      </div>

      {/* +30 Seconds Button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleAdd30Seconds(); }}
        className="relative z-50 mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/20 border border-primary/30 text-primary active:scale-95 active:bg-primary/30 transition-transform cursor-pointer select-none"
        style={{ pointerEvents: 'auto' }}
      >
        <Plus className="w-5 h-5" />
        <span className="font-display text-base">+30 SANİYE</span>
      </button>

      {/* Next Exercise Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 glass-card p-4 w-[85%] max-w-sm"
      >
        <div className="flex items-center gap-2 text-primary mb-3">
          <ArrowRight className="w-4 h-4" />
          <span className="font-display text-xs tracking-wider">SIRADAKİ HAREKET</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg text-foreground">{nextExerciseName}</p>
            <p className="text-muted-foreground text-sm">{nextExerciseSets} set × {nextExerciseReps} tekrar</p>
          </div>
        </div>
      </motion.div>

      {/* Sound Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex items-center gap-2 text-muted-foreground"
      >
        <Volume2 className="w-4 h-4" />
        <span className="text-xs">Sesli uyarı aktif</span>
      </motion.div>

      {/* Skip Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSkip}
        className="absolute bottom-12 flex items-center gap-3 bg-secondary/80 hover:bg-secondary px-8 py-4 rounded-2xl border border-white/10 transition-colors"
      >
        <SkipForward className="w-5 h-5 text-primary" />
        <span className="font-display text-foreground tracking-wide">DİNLENMEYİ ATLA</span>
      </motion.button>
    </motion.div>
  );
};

export default ExerciseRestTimerOverlay;
