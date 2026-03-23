import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Moon, Brain, Flame, Heart, Sparkles, Apple, RefreshCw, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/context/AuthContext";
import { useBioCoin } from "@/hooks/useBioCoin";
import { useStreakTracking } from "@/hooks/useStreakTracking";
import { useXPEngine } from "@/hooks/useXPEngine";
import { supabase } from "@/integrations/supabase/client";
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

interface SliderConfig {
  id: SliderKey;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  trackColor: string;
}

const sliderConfigs: SliderConfig[] = [
  {
    id: "mood",
    label: "RUH HALİ",
    icon: <Heart className="w-4 h-4" />,
    gradient: "from-pink-500 to-rose-500",
    trackColor: "bg-pink-500/20",
  },
  {
    id: "sleep",
    label: "UYKU KALİTESİ",
    icon: <Moon className="w-4 h-4" />,
    gradient: "from-purple-500 to-violet-500",
    trackColor: "bg-purple-500/20",
  },
  {
    id: "soreness",
    label: "KAS AĞRISI",
    icon: <Flame className="w-4 h-4" />,
    gradient: "from-orange-500 to-amber-500",
    trackColor: "bg-orange-500/20",
  },
  {
    id: "stress",
    label: "STRES SEVİYESİ",
    icon: <Brain className="w-4 h-4" />,
    gradient: "from-blue-500 to-cyan-500",
    trackColor: "bg-blue-500/20",
  },
  {
    id: "digestion",
    label: "SİNDİRİM",
    icon: <Apple className="w-4 h-4" />,
    gradient: "from-green-500 to-emerald-500",
    trackColor: "bg-green-500/20",
  },
];

const defaultValues: Record<SliderKey, number> = { mood: 3, sleep: 3, soreness: 3, stress: 3, digestion: 3 };

function calculateReadiness(v: Record<SliderKey, number>): number {
  return Math.round(
    (v.mood / 5) * 20 + (v.sleep / 5) * 30 + ((5 - v.soreness) / 5) * 20 + ((5 - v.stress) / 5) * 20 + (v.digestion / 5) * 10
  );
}

const DailyCheckIn = ({ isOpen, onClose, onSubmit }: DailyCheckInProps) => {
  const { triggerAchievement } = useAchievements();
  const { user } = useAuth();
  const { awardCoins } = useBioCoin();
  const { updateStreak } = useStreakTracking();
  const { awardXP } = useXPEngine();
  const [sleepHours, setSleepHours] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCheckin, setExistingCheckin] = useState<{ id: string; values: Record<SliderKey, number>; notes: string; sleepHours: number | null } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const loadTodayCheckin = useCallback(async () => {
    if (!user?.id || !isOpen) return;
    const today = new Date().toISOString().split("T")[0];
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
  }, [loadTodayCheckin]);

  const handleSliderChange = (id: SliderKey, newValue: number[]) => {
    setValues((prev) => ({ ...prev, [id]: newValue[0] }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Lütfen giriş yapın.");
      return;
    }

    setIsSubmitting(true);
    const readiness_score = calculateReadiness(values);

    try {
      if (isEditMode && existingCheckin) {
        // Update existing record
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

        // Log the edit
        await supabase.from("checkin_edit_logs").insert({
          checkin_id: existingCheckin.id,
          user_id: user.id,
          previous_values: existingCheckin.values as any,
          new_values: values as any,
        });

        toast.success("Check-in güncellendi!");
      } else {
        // New insert
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
        triggerAchievement("daily_checkin");
        await awardCoins(50, "bonus", "Günlük Check-in Tamamlandı");
        await updateStreak();
        await awardXP(50);
        toast.success("Check-in tamamlandı! Koçuna iletildi.");
      }

      // Update readiness on profile
      await supabase.from("profiles").update({ readiness_score }).eq("id", user.id);

      const checkInData: DailyCheckInType = {
        date: new Date().toISOString().split("T")[0],
        ...values,
        notes,
      };
      onSubmit?.(checkInData);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Check-in kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[380px] bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <DialogHeader className="p-5 pb-3 border-b border-white/5">
          <DialogTitle className="font-display text-lg text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isEditMode ? "CHECK-IN GÜNCELLE" : "GÜNLÜK CHECK-IN"}
            {isEditMode && (
              <span className="ml-auto text-[10px] font-display text-muted-foreground bg-white/5 px-2 py-1 rounded-full flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> DÜZENLEME
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {sliderConfigs.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                    {config.icon}
                  </div>
                  <span className="font-display text-xs text-muted-foreground tracking-wider">
                    {config.label}
                  </span>
                </div>
                <div className={`font-display text-xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                  {values[config.id]}
                </div>
              </div>
              <div className="relative">
                <div className={`absolute inset-0 h-2 rounded-full ${config.trackColor}`} />
                <Slider
                  value={[values[config.id]]}
                  onValueChange={(val) => handleSliderChange(config.id, val)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full relative z-10"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 font-display">
                <span>DÜŞÜK</span>
                <span>YÜKSEK</span>
              </div>
            </motion.div>
          ))}

          {/* Sleep Hours Input */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="font-display text-xs text-muted-foreground tracking-wider">
                  UYKU SÜRESİ (SAAT)
                </span>
              </div>
              <div className="font-display text-xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                {sleepHours ?? "--"}
              </div>
            </div>
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleepHours ?? ""}
              onChange={(e) => setSleepHours(e.target.value ? Number(e.target.value) : null)}
              placeholder="Örn: 7.5"
              className="bg-white/[0.03] border-white/10 text-sm focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2 pt-2"
          >
            <label className="font-display text-xs text-muted-foreground tracking-wider">NOTLAR</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bugün hakkında notlar... (opsiyonel)"
              className="bg-white/[0.03] border-white/10 min-h-[80px] resize-none text-sm focus:border-primary/50 focus:ring-primary/20"
            />
          </motion.div>
        </div>

        <div className="p-5 pt-3 border-t border-white/5">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-display text-sm tracking-wider rounded-xl transition-all duration-300 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mr-2"
              >
                <Send className="w-4 h-4" />
              </motion.div>
            ) : (
              <>
                {isEditMode ? <RefreshCw className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {isEditMode ? "GÜNCELLE" : "KAYDET"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckIn;
