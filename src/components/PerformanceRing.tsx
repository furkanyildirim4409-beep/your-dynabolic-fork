import { motion } from "framer-motion";
import { useTodayCheckin } from "@/hooks/useTodayCheckin";

function calculateReadiness(v: { mood: number; sleep: number; soreness: number; stress: number; digestion: number }, sleepHours?: number | null): number {
  let base = Math.round(
    (v.mood / 5) * 20 + (v.sleep / 5) * 30 + ((5 - v.soreness) / 5) * 20 + ((5 - v.stress) / 5) * 20 + (v.digestion / 5) * 10
  );
  if (sleepHours != null && sleepHours < 7) {
    base -= Math.round((7 - sleepHours) * 3);
  }
  return Math.max(0, Math.min(100, base));
}

function getScoreTheme(score: number) {
  if (score >= 80) return { h: 142, s: 71, l: 45, label: "HAZIRSIN", sublabel: "Yüksek yoğunluklu antrenman için uygun" };
  if (score >= 60) return { h: 45, s: 93, l: 47, label: "ORTA SEVİYE", sublabel: "Orta yoğunlukta antrenman önerilir" };
  return { h: 0, s: 84, l: 60, label: "DİNLEN", sublabel: "Bugün hafif aktivite veya dinlenme önerilir" };
}

const PerformanceRing = () => {
  const { data: checkin, isLoading: loading } = useTodayCheckin();

  const score = checkin
    ? calculateReadiness(
        {
          mood: checkin.mood ?? 3,
          sleep: Number(checkin.sleep) ?? 3,
          soreness: checkin.soreness ?? 3,
          stress: checkin.stress ?? 3,
          digestion: checkin.digestion ?? 3,
        },
        checkin.sleep_hours
      )
    : null;

  const circumference = 2 * Math.PI * 120;
  const hasData = score !== null;
  const theme = hasData ? getScoreTheme(score) : null;
  const strokeDashoffset = hasData ? circumference - (score / 100) * circumference : circumference;
  const displayScore = hasData ? String(score) : "--";
  const label = hasData ? theme!.label : "VERİ BEKLENİYOR";
  const sublabel = hasData ? theme!.sublabel : "Günlük check-in'ini tamamla";

  const strokeColor = hasData ? `hsl(${theme!.h}, ${theme!.s}%, ${theme!.l}%)` : "hsl(var(--muted-foreground))";
  const glowColor = strokeColor;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-64 h-64 rounded-full bg-muted/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      <div className="relative w-64 h-64">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r="120" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" opacity="0.3" />
        </svg>

        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} />
              <stop offset="50%" stopColor={hasData ? `hsl(${theme!.h}, ${theme!.s}%, ${theme!.l + 10}%)` : strokeColor} />
              <stop offset="100%" stopColor={hasData ? `hsl(${theme!.h}, ${theme!.s}%, ${theme!.l - 5}%)` : strokeColor} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {hasData && (
            <>
              <motion.circle
                cx="128" cy="128" r="120" fill="none" stroke={glowColor} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }} filter="url(#glow)" opacity="0.5"
              />
              <motion.circle
                cx="128" cy="128" r="120" fill="none" stroke="url(#ringGradient)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
            </>
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className={`font-display text-7xl font-extrabold tracking-tight ${hasData ? "text-foreground" : "text-muted-foreground"}`}
          >
            {displayScore}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1 }}
            className={`font-medium text-sm uppercase tracking-widest mt-1 ${hasData ? "text-primary" : "text-muted-foreground"}`}
          >
            {label}
          </motion.span>
        </div>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-muted-foreground text-sm mt-4">
        {sublabel}
      </motion.p>
    </div>
  );
};

export default PerformanceRing;
