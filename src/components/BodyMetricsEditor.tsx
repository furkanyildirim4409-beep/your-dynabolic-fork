import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ruler, Activity, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const GENDERS = [
  { value: "male", label: "Erkek", icon: "💪" },
  { value: "female", label: "Kadın", icon: "🧘‍♀️" },
  { value: "other", label: "Diğer", icon: "⚡" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Masa Başı", desc: "Az hareket", icon: "🪑" },
  { value: "light", label: "Hafif Aktif", desc: "Haftada 1-2", icon: "🚶" },
  { value: "moderate", label: "Aktif", desc: "Haftada 3-5", icon: "🏃" },
  { value: "very_active", label: "Çok Aktif", desc: "Haftada 6+", icon: "🔥" },
];

interface BodyMetricsEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const BodyMetricsEditor = ({ isOpen, onClose }: BodyMetricsEditorProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [gender, setGender] = useState("male");
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");

  useEffect(() => {
    if (isOpen && profile) {
      const p = profile as Record<string, unknown>;
      setGender((p.gender as string) || "male");
      setBirthDate(p.birth_date ? new Date(p.birth_date as string) : undefined);
      setHeightCm(p.height_cm ? String(p.height_cm) : "");
      setWeightKg(p.current_weight ? String(p.current_weight) : "");
      setActivityLevel((p.activity_level as string) || "moderate");
    }
  }, [isOpen, profile]);

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
    toast.success("Vücut verilerin güncellendi! 💪");
    setSaving(false);
    onClose();
  };

  const canSave = !!heightCm && !!weightKg && Number(heightCm) > 0 && Number(weightKg) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[400px] max-h-[85vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Activity className="w-5 h-5 text-primary" />
            Vücut Verilerim
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Gender */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Cinsiyet</label>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                    gender === g.value
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-xl">{g.icon}</span>
                  <span className="text-xs font-medium text-foreground">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Doğum Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  {birthDate ? format(birthDate, "d MMMM yyyy", { locale: tr }) : "Tarih seç (opsiyonel)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
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

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Boy (cm)</label>
              <Input
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="h-12 text-center bg-card border-border"
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
                className="h-12 text-center bg-card border-border"
                min={30}
                max={300}
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Aktivite Seviyesi</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setActivityLevel(a.value)}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 text-left",
                    activityLevel === a.value
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <p className="font-medium text-foreground text-xs">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="w-full h-12 font-semibold"
          >
            {saving ? "Kaydediliyor..." : <><Sparkles className="w-4 h-4 mr-1" /> Güncelle</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BodyMetricsEditor;
