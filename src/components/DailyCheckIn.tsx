import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Moon, Brain, Flame, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/context/AuthContext";
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

interface SliderConfig {
  id: keyof Pick<DailyCheckInType, "mood" | "sleep" | "soreness" | "stress">;
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
];

function calculateReadiness(mood: number, sleep: number, soreness: number, stress: number): number {
  return Math.round(
    (mood / 5) * 25 + (sleep / 5) * 35 + ((5 - soreness) / 5) * 20 + ((5 - stress) / 5) * 20
  );
}

const DailyCheckIn = ({ isOpen, onClose, onSubmit }: DailyCheckInProps) => {
  const { triggerAchievement } = useAchievements();
  const { user } = useAuth();
  const [values, setValues] = useState({ mood: 3, sleep: 3, soreness: 3, stress: 3 });
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  // Check if already submitted today
  useEffect(() => {
    if (!user?.id || !isOpen) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("daily_checkins")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59.999`)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setHasSubmittedToday(true);
      });
  }, [user?.id, isOpen]);

  const handleSliderChange = (id: keyof typeof values, newValue: number[]) => {
    setValues((prev) => ({ ...prev, [id]: newValue[0] }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Lütfen giriş yapın.");
      return;
    }

    setIsSubmitting(true);

    const readiness_score = calculateReadiness(values.mood, values.sleep, values.soreness, values.stress);

    try {
      // Insert check-in
      const { error: checkinError } = await supabase.from("daily_checkins").insert({
        user_id: user.id,
        mood: values.mood,
        sleep: values.sleep,
        soreness: values.soreness,
        stress: values.stress,
        notes: notes || null,
      });

      if (checkinError) throw checkinError;

      // Update readiness on profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ readiness_score })
        .eq("id", user.id);

      if (profileError) console.error("Profile update error:", profileError.message);

      const checkInData: DailyCheckInType = {
        date: new Date().toISOString().split("T")[0],
        mood: values.mood,
        sleep: values.sleep,
        soreness: values.soreness,
        stress: values.stress,
        notes,
      };

      onSubmit?.(checkInData);
      triggerAchievement("daily_checkin");
      setHasSubmittedToday(true);
      toast.success("Check-in tamamlandı! Koçuna iletildi.");
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
            GÜNLÜK CHECK-IN
          </DialogTitle>
        </DialogHeader>

        {hasSubmittedToday ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-display text-sm text-muted-foreground">Bugünkü check-in tamamlandı ✓</p>
          </div>
        ) : (
          <>
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
                    <Send className="w-4 h-4 mr-2" />
                    KAYDET
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckIn;
