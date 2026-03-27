import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ruler, Target, Activity, ChevronRight, ChevronLeft, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FITNESS_GOALS = [
  { value: "muscle_gain", label: "Kas Geliştirme", icon: "💪", desc: "Kas kütleni artır" },
  { value: "fat_loss", label: "Yağ Yakımı", icon: "🔥", desc: "Yağ oranını düşür" },
  { value: "strength", label: "Güç Kazanımı", icon: "🏋️", desc: "Maksimum güce ulaş" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Masa Başı", desc: "Az hareket, ofis işi", icon: "🪑" },
  { value: "light", label: "Hafif Aktif", desc: "Haftada 1-2 antrenman", icon: "🚶" },
  { value: "moderate", label: "Aktif", desc: "Haftada 3-5 antrenman", icon: "🏃" },
  { value: "very_active", label: "Çok Aktif", desc: "Haftada 6+ antrenman", icon: "🔥" },
];

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("muscle_gain");
  const [activityLevel, setActivityLevel] = useState("moderate");

  const next = () => { setDir(1); setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const prev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return !!heightCm && !!weightKg && Number(heightCm) > 0 && Number(weightKg) > 0;
    if (step === 2) return !!fitnessGoal;
    return !!activityLevel;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      height_cm: Number(heightCm),
      current_weight: Number(weightKg),
      target_weight: Number(targetWeight) || null,
      fitness_goal: fitnessGoal,
      activity_level: activityLevel,
      onboarding_completed: true,
    }).eq("id", user.id);

    if (error) {
      toast.error("Kaydedilemedi: " + error.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    toast.success("Gladyatör kimliğin hazır! 💪");
    navigate("/", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="w-full max-w-[420px] px-4">
        {/* Progress dots */}
        {step > 0 && (
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20"
                >
                  <Swords className="w-10 h-10 text-primary" />
                </motion.div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Arenaya Hoş Geldin
                  </h1>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-[320px] mx-auto">
                    Gladyatör kimliğini oluşturmak için birkaç soruya cevap ver.
                  </p>
                </div>
                <Button onClick={next} className="w-full h-14 text-lg font-bold mt-4">
                  Başla <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 1: Body Stats */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                    <Ruler className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Vücut Ölçülerin</h2>
                  <p className="text-muted-foreground text-sm">Kalori algoritması için kritik veriler</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Boy (cm)</label>
                    <Input type="number" placeholder="175" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="h-14 text-lg text-center bg-card border-border" min={100} max={250} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Kilo (kg)</label>
                    <Input type="number" placeholder="75" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="h-14 text-lg text-center bg-card border-border" min={30} max={300} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Hedef Kilo (kg) <span className="text-muted-foreground/60">— opsiyonel</span></label>
                    <Input type="number" placeholder="70" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="h-14 text-lg text-center bg-card border-border" min={30} max={300} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Fitness Goal */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                    <Target className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Hedefin Ne?</h2>
                  <p className="text-muted-foreground text-sm">Antrenman planın buna göre şekillenecek</p>
                </div>
                <div className="space-y-3">
                  {FITNESS_GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setFitnessGoal(g.value)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                        fitnessGoal === g.value
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="text-3xl">{g.icon}</span>
                      <div>
                        <p className="font-semibold text-foreground">{g.label}</p>
                        <p className="text-xs text-muted-foreground">{g.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Activity Level */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                    <Activity className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Aktivite Seviyesi</h2>
                  <p className="text-muted-foreground text-sm">Günlük hareket düzeyini belirle</p>
                </div>
                <div className="space-y-3">
                  {ACTIVITY_LEVELS.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setActivityLevel(a.value)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                        activityLevel === a.value
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <div>
                        <p className="font-medium text-foreground text-sm">{a.label}</p>
                        <p className="text-xs text-muted-foreground">{a.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step > 0 && (
          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={prev} className="flex-1 h-12">
              <ChevronLeft className="w-4 h-4 mr-1" /> Geri
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={next} disabled={!canProceed()} className="flex-1 h-12 font-semibold">
                Devam <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving || !canProceed()} className="flex-1 h-12 font-semibold">
                {saving ? "Kaydediliyor..." : <><Sparkles className="w-4 h-4 mr-1" /> Kaydet ve Başla</>}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
