import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Ruler, Activity, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const GENDERS = [
  { value: "male", label: "Erkek", icon: "💪" },
  { value: "female", label: "Kadın", icon: "🧘‍♀️" },
  { value: "other", label: "Diğer", icon: "⚡" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Masa Başı", desc: "Az hareket, ofis işi", icon: "🪑" },
  { value: "light", label: "Hafif Aktif", desc: "Haftada 1-2 antrenman", icon: "🚶" },
  { value: "moderate", label: "Aktif", desc: "Haftada 3-5 antrenman", icon: "🏃" },
  { value: "very_active", label: "Çok Aktif", desc: "Haftada 6+ antrenman", icon: "🔥" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
};

const BodyMetricsOnboarding = () => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  const [gender, setGender] = useState("male");
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");

  const next = () => { setDir(1); setStep((s) => Math.min(s + 1, 2)); };
  const prev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canProceed = () => {
    if (step === 0) return !!gender;
    if (step === 1) return !!heightCm && !!weightKg && Number(heightCm) > 0 && Number(weightKg) > 0;
    return !!activityLevel;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      gender,
      birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : null,
      height_cm: Number(heightCm),
      current_weight: Number(weightKg),
      activity_level: activityLevel,
    }).eq("id", user.id);

    if (error) {
      toast.error("Kaydedilemedi: " + error.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    toast.success("Profilin hazır! Haydi başlayalım 💪");
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-xl safe-top">
      <div className="w-full max-w-[400px] px-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-muted"
              )}
            />
          ))}
        </div>

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
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-2">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Seni Tanıyalım</h2>
                  <p className="text-muted-foreground text-sm">Cinsiyet ve doğum tarihini seç</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGender(g.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                        gender === g.value
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(68,100%,50%,0.15)]"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      )}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-xs font-medium text-foreground">{g.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Doğum Tarihi</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        {birthDate ? format(birthDate, "d MMMM yyyy", { locale: tr }) : "Tarih seç (opsiyonel)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        disabled={(d) => d > new Date() || d < new Date("1940-01-01")}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        captionLayout="dropdown-buttons"
                        fromYear={1940}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

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
                    <Input
                      type="number"
                      placeholder="175"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="h-14 text-lg text-center bg-card border-border"
                      min={100}
                      max={250}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Kilo (kg)</label>
                    <Input
                      type="number"
                      placeholder="75"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="h-14 text-lg text-center bg-card border-border"
                      min={30}
                      max={300}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
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
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(68,100%,50%,0.15)]"
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
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={prev} className="flex-1 h-12">
              <ChevronLeft className="w-4 h-4 mr-1" /> Geri
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={next} disabled={!canProceed()} className="flex-1 h-12 font-semibold">
              Devam <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || !canProceed()} className="flex-1 h-12 font-semibold">
              {saving ? "Kaydediliyor..." : <><Sparkles className="w-4 h-4 mr-1" /> Kaydet ve Başla</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyMetricsOnboarding;
