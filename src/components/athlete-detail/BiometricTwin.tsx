import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useBodyMeasurements, type BodyMeasurement } from "@/hooks/useBodyMeasurements";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BiometricTwinProps {
  onAddMeasurement?: () => void;
}

interface BadgeConfig {
  label: string;
  key: keyof BodyMeasurement;
  unit: string;
  x: number;
  y: number;
  lineX: number;
  lineY: number;
  align: "left" | "right";
}

const badges: BadgeConfig[] = [
  { label: "Boyun", key: "neck", unit: "cm", x: 72, y: 5, lineX: 50, lineY: 14, align: "right" },
  { label: "Omuz", key: "shoulder", unit: "cm", x: 72, y: 18, lineX: 62, lineY: 22, align: "right" },
  { label: "Göğüs", key: "chest", unit: "cm", x: -2, y: 22, lineX: 38, lineY: 28, align: "left" },
  { label: "Kol", key: "arm", unit: "cm", x: -2, y: 38, lineX: 28, lineY: 35, align: "left" },
  { label: "Bel", key: "waist", unit: "cm", x: 72, y: 38, lineX: 55, lineY: 42, align: "right" },
  { label: "Kalça", key: "hips", unit: "cm", x: -2, y: 54, lineX: 42, lineY: 52, align: "left" },
  { label: "Bacak", key: "thigh", unit: "cm", x: 72, y: 58, lineX: 58, lineY: 60, align: "right" },
  { label: "Yağ Oranı", key: "body_fat_pct", unit: "%", x: -2, y: 70, lineX: 42, lineY: 65, align: "left" },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const BiometricTwin = ({ onAddMeasurement }: BiometricTwinProps) => {
  const { history, loading } = useBodyMeasurements();
  const [sliderValue, setSliderValue] = useState([0]);

  useEffect(() => {
    if (history.length > 0) {
      setSliderValue([0]);
    }
  }, [history.length]);

  // history is sorted desc (latest first) — slider 0 = latest
  const currentRecord = useMemo(() => {
    if (!history.length) return null;
    const idx = Math.min(sliderValue[0], history.length - 1);
    return history[idx];
  }, [history, sliderValue]);

  const dateLabel = useMemo(() => {
    if (!currentRecord?.logged_at) return "—";
    return format(new Date(currentRecord.logged_at), "dd MMM yyyy", { locale: tr });
  }, [currentRecord]);

  const getValue = (key: keyof BodyMeasurement): string => {
    if (!currentRecord) return "—";
    const v = currentRecord[key];
    if (v == null || v === 0) return "—";
    return String(v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="backdrop-blur-xl bg-card/80 border border-border rounded-2xl p-5 overflow-hidden transform-gpu"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-foreground tracking-wide">
          BİYOMETRİK İKİZ
        </h2>
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[10px] text-primary font-semibold tracking-wider">CANLI</span>
        </div>
      </div>

      {/* Body + Badges Area */}
      <div className="relative" style={{ minHeight: 380 }}>
        {/* SVG Body Silhouette */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 120 280" className="h-[340px] opacity-60" fill="none">
            {/* Head */}
            <ellipse cx="60" cy="22" rx="14" ry="16" stroke="hsl(var(--primary))" strokeWidth="1" fill="hsl(var(--primary) / 0.05)" />
            {/* Neck */}
            <rect x="54" y="38" width="12" height="10" rx="4" stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" />
            {/* Shoulders + Torso */}
            <path d="M30 52 Q36 48 54 48 L66 48 Q84 48 90 52 L92 60 Q94 90 88 110 L82 130 Q76 138 60 140 Q44 138 38 130 L32 110 Q26 90 28 60 Z"
              stroke="hsl(var(--primary))" strokeWidth="1" fill="hsl(var(--primary) / 0.04)" />
            {/* Left arm */}
            <path d="M30 52 Q22 58 20 80 Q18 100 22 120 Q24 130 28 135"
              stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Right arm */}
            <path d="M90 52 Q98 58 100 80 Q102 100 98 120 Q96 130 92 135"
              stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Left leg */}
            <path d="M44 138 Q42 160 40 190 Q38 220 36 248 Q35 258 38 262"
              stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Right leg */}
            <path d="M76 138 Q78 160 80 190 Q82 220 84 248 Q85 258 82 262"
              stroke="hsl(var(--primary))" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            {/* Waist line hint */}
            <ellipse cx="60" cy="115" rx="22" ry="4" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" strokeDasharray="3 2" fill="none" />
            {/* Hip line hint */}
            <ellipse cx="60" cy="138" rx="24" ry="5" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" strokeDasharray="3 2" fill="none" />
          </svg>
        </div>

        {/* Floating Badges */}
        <motion.div
          className="relative z-10"
          style={{ minHeight: 380 }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {badges.map((b) => {
            const val = getValue(b.key);
            const unit = b.key === "body_fat_pct" ? "%" : b.unit;
            return (
              <motion.div
                key={b.key}
                variants={badgeVariants}
                className="absolute"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  maxWidth: "30%",
                }}
              >
                <div className={`backdrop-blur-md bg-card/70 border rounded-xl px-3 py-2 ${
                  val !== "—" ? "border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]" : "border-border/40"
                }`}>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">
                    {b.label}
                  </p>
                  <p className={`font-display text-base leading-tight ${val !== "—" ? "text-primary" : "text-muted-foreground/50"}`}>
                    {val !== "—" ? `${val}${unit === "%" ? "" : ""}` : "—"}
                    {val !== "—" && <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Timeline Slider */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Zaman Yolculuğu
          </h3>
        </div>

        {history.length > 1 ? (
          <>
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={history.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>En Yeni</span>
              <span className="text-primary font-semibold">{dateLabel}</span>
              <span>En Eski</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            {loading ? "Yükleniyor..." : "Henüz yeterli ölçüm kaydı yok."}
          </p>
        )}
      </div>

      {/* Add Measurement CTA */}
      {onAddMeasurement && (
        <Button
          onClick={onAddMeasurement}
          className="w-full mt-4 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-display tracking-wide"
          variant="ghost"
        >
          <Plus className="w-4 h-4 mr-2" />
          YENİ ÖLÇÜM EKLE
        </Button>
      )}
    </motion.div>
  );
};

export default BiometricTwin;
