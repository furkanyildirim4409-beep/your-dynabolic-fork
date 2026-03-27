import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/context/AuthContext";
import { useBioCoin } from "@/hooks/useBioCoin";
import { useStreakTracking } from "@/hooks/useStreakTracking";
import { useXPEngine } from "@/hooks/useXPEngine";
import { supabase } from "@/integrations/supabase/client";
import { getIstanbulDateStr } from "@/lib/timezone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DailyCheckIn as DailyCheckInType } from "@/types/shared-models";

interface DailyCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: DailyCheckInType) => void;
}

type SliderKey = "mood" | "sleep" | "soreness" | "stress" | "digestion";

interface MetricConfig {
  id: SliderKey;
  label: string;
  emojis: string[];
  emojiLabels: string[];
  gradient: string;
  isNegative?: boolean;
}

const positiveMetrics: MetricConfig[] = [
  {
    id: "mood",
    label: "RUH HALİ",
    emojis: ["😫", "😕", "😐", "🙂", "🤩"],
    emojiLabels: ["Berbat", "Kötü", "Normal", "İyi", "Harika"],
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "sleep",
    label: "UYKU KALİTESİ",
    emojis: ["😴", "🥱", "😐", "😌", "💤"],
    emojiLabels: ["Çok Kötü", "Kötü", "Normal", "İyi", "Mükemmel"],
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: "digestion",
    label: "ENERJİ SEVİYESİ",
    emojis: ["🪫", "🔋", "⚡", "💥", "🚀"],
    emojiLabels: ["Tükenmiş", "Düşük", "Normal", "Yüksek", "Patlıyor"],
    gradient: "from-green-500 to-emerald-500",
  },
];

const negativeMetrics: MetricConfig[] = [
  {
    id: "soreness",
    label: "KAS AĞRISI",
    emojis: ["🧘", "😐", "😣", "😖", "🤕"],
    emojiLabels: ["Yok", "Hafif", "Orta", "Şiddetli", "Dayanılmaz"],
    gradient: "from-orange-500 to-amber-500",
    isNegative: true,
  },
  {
    id: "stress",
    label: "STRES SEVİYESİ",
    emojis: ["🧘‍♂️", "😐", "😰", "😤", "🤯"],
    emojiLabels: ["Sıfır", "Az", "Orta", "Yüksek", "Aşırı"],
    gradient: "from-blue-500 to-cyan-500",
    isNegative: true,
  },
];

const defaultValues: Record<SliderKey, number> = { mood: 3, sleep: 3, soreness: 3, stress: 3, digestion: 3 };

function calculateReadiness(v: Record<SliderKey, number>): number {
  return Math.round(
    (v.mood / 5) * 20 + (v.sleep / 5) * 30 + ((6 - v.soreness) / 5) * 20 + ((6 - v.stress) / 5) * 20 + (v.digestion / 5) * 10
  );
}

function getScoreTheme(score: number) {
  if (score >= 80) return { color: "text-green-400", label: "HAZIRSIN 🔥" };
  if (score >= 60) return { color: "text-yellow-400", label: "DİKKATLİ OL ⚠️" };
  return { color: "text-red-400", label: "DİNLEN 🛌" };
}

const STEP_TITLES = ["Pozitif Metrikler", "Negatif Metrikler & Uyku", "Notlar & Özet"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
};

function MetricCard({ metric, value, onChange }: { metric: MetricConfig; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs text-muted-foreground tracking-wider">{metric.label}</span>
        {metric.isNegative && (
          <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded-full">1 = En İyi</span>
        )}
      </div>
      <ToggleGroup
        type="single"
        value={String(value)}
        onValueChange={(v) => { if (v) onChange(Number(v)); }}
        className="flex justify-between gap-1.5"
      >
        {metric.emojis.map((emoji, i) => {
          const val = i + 1;
          const isActive = value === val;
          return (
            <ToggleGroupItem
              key={val}
              value={String(val)}
              className={`flex-1 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xl transition-all duration-200 border ${
                isActive
                  ? `bg-gradient-to-br ${metric.gradient} border-transparent shadow-lg scale-105 text-white`
                  : "border-border/30 bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className={`text-[9px] font-display leading-none ${isActive ? "text-white/90" : "text-muted-foreground/60"}`}>
                {metric.emojiLabels[i]}
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}

const DailyCheckIn = ({ isOpen, onClose, onSubmit }: DailyCheckInProps) => {
  const { triggerAchievement } = useAchievements();
  const { user } = useAuth();
  const { processTransaction } = useBioCoin();
  const { updateStreak } = useStreakTracking();
  const { awardXP } = useXPEngine();
  const [values, setValues] = useState<Record<SliderKey, number>>({ ...defaultValues });
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCheckin, setExistingCheckin] = useState<{ id: string; values: Record<SliderKey, number>; notes: string; sleepHours: number | null } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const loadTodayCheckin = useCallback(async () => {
    if (!user?.id || !isOpen) return;
    const today = getIstanbulDateStr();
    const { data } = await supabase
      .from("daily_checkins")
      .select("id, mood, sleep, soreness, stress, digestion, notes, sleep_hours")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59.999`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const row = data[0];
      const loaded: Record<SliderKey, number> = {
        mood: row.mood ?? 3,
        sleep: Number(row.sleep) ?? 3,
        soreness: row.soreness ?? 3,
        stress: row.stress ?? 3,
        digestion: row.digestion ?? 3,
      };
      setExistingCheckin({ id: row.id, values: loaded, notes: row.notes ?? "", sleepHours: row.sleep_hours ?? null });
      setValues(loaded);
      setSleepHours(row.sleep_hours ?? null);
      setNotes(row.notes ?? "");
      setIsEditMode(true);
    } else {
      setExistingCheckin(null);
      setValues({ ...defaultValues });
      setSleepHours(null);
      setNotes("");
      setIsEditMode(false);
    }
  }, [user?.id, isOpen]);

  useEffect(() => {
    loadTodayCheckin();
    setStep(0);
  }, [loadTodayCheckin]);

  const handleValueChange = (id: SliderKey, newValue: number) => {
    setValues((prev) => ({ ...prev, [id]: newValue }));
  };

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 2)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    if (!user?.id) { toast.error("Lütfen giriş yapın."); return; }
    setIsSubmitting(true);
    const readiness_score = calculateReadiness(values);

    try {
      if (isEditMode && existingCheckin) {
        const { error: updateErr } = await supabase
          .from("daily_checkins")
          .update({
            mood: values.mood,
            sleep: values.sleep,
            soreness: values.soreness,
            stress: values.stress,
            digestion: values.digestion,
            sleep_hours: sleepHours,
            notes: notes || null,
          } as any)
          .eq("id", existingCheckin.id);
        if (updateErr) throw updateErr;

        await supabase.from("checkin_edit_logs").insert({
          checkin_id: existingCheckin.id,
          user_id: user.id,
          previous_values: existingCheckin.values as any,
          new_values: values as any,
        });
        toast.success("Check-in güncellendi!");
      } else {
        const { error: checkinError } = await supabase.from("daily_checkins").insert({
          user_id: user.id,
          mood: values.mood,
          sleep: values.sleep,
          soreness: values.soreness,
          stress: values.stress,
          digestion: values.digestion,
          sleep_hours: sleepHours,
          notes: notes || null,
        } as any);
        if (checkinError) throw checkinError;

        await updateStreak();
        await awardXP(50);
        await processTransaction(10, 'daily_reward', 'Günlük Check-in Ödülü');
        setTimeout(() => { triggerAchievement("daily_checkin"); }, 1000);
        toast.success("Check-in tamamlandı! Koçuna iletildi.");
      }

      await supabase.from("profiles").update({ readiness_score }).eq("id", user.id);

      const checkInData: DailyCheckInType = { date: getIstanbulDateStr(), ...values, notes };
      onSubmit?.(checkInData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Check-in kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const readiness = calculateReadiness(values);
  const theme = getScoreTheme(readiness);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-2xl border border-border/50 rounded-2xl p-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="font-display text-lg text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isEditMode ? "CHECK-IN GÜNCELLE" : "GÜNLÜK CHECK-IN"}
            {isEditMode && (
              <span className="ml-auto text-[10px] font-display text-muted-foreground bg-muted/30 px-2 py-1 rounded-full flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> DÜZENLEME
              </span>
            )}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {STEP_TITLES.map((title, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-muted/30"}`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-display tracking-wider pt-1">
            {step + 1}/3 — {STEP_TITLES[step]}
          </p>
        </DialogHeader>

        <div className="px-5 pb-2 min-h-[320px] relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {positiveMetrics.map((m) => (
                  <MetricCard key={m.id} metric={m} value={values[m.id]} onChange={(v) => handleValueChange(m.id, v)} />
                ))}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {negativeMetrics.map((m) => (
                  <MetricCard key={m.id} metric={m} value={values[m.id]} onChange={(v) => handleValueChange(m.id, v)} />
                ))}
                {/* Sleep Hours */}
                <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-3">
                  <span className="font-display text-xs text-muted-foreground tracking-wider">UYKU SÜRESİ (SAAT)</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛏️</span>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={sleepHours ?? ""}
                      onChange={(e) => setSleepHours(e.target.value ? Number(e.target.value) : null)}
                      placeholder="Örn: 7.5"
                      className="bg-muted/20 border-border/30 text-sm focus:border-primary/50 focus:ring-primary/20 flex-1"
                    />
                    <span className="font-display text-xl font-bold text-foreground">{sleepHours ?? "--"}h</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Notes */}
                <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-2">
                  <span className="font-display text-xs text-muted-foreground tracking-wider">NOTLAR</span>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bugün hakkında notlar... (opsiyonel)"
                    className="bg-muted/20 border-border/30 min-h-[80px] resize-none text-sm focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>

                {/* Live Readiness Preview */}
                <div className="bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-6 flex flex-col items-center gap-2">
                  <span className="font-display text-xs text-muted-foreground tracking-wider">HAZIRLIK SKORU ÖNİZLEME</span>
                  <motion.span
                    key={readiness}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`font-display text-5xl font-extrabold ${theme.color}`}
                  >
                    {readiness}
                  </motion.span>
                  <span className="text-sm text-muted-foreground">{theme.label}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-5 pt-3 border-t border-border/20 flex items-center gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={goBack} className="h-11 rounded-xl border-border/30 bg-muted/20">
              <ChevronLeft className="w-4 h-4 mr-1" /> Geri
            </Button>
          )}
          <div className="flex-1" />
          {step < 2 ? (
            <Button onClick={goNext} className="h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-display text-sm tracking-wider shadow-lg shadow-primary/20">
              İleri <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-display text-sm tracking-wider shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mr-2">
                  <Send className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  {isEditMode ? <RefreshCw className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {isEditMode ? "GÜNCELLE" : "KAYDET"}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckIn;
