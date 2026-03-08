import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { calcNavyBodyFat, calcMuscleMass, calcBMR, calcTDEE, calcMacroTargets, useBodyMeasurements, type MeasurementInput } from "@/hooks/useBodyMeasurements";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Ruler, Calculator, UserCog, Target } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const fields: { key: keyof MeasurementInput; label: string; unit: string; min?: number; max?: number; placeholder?: string }[] = [
  { key: "neck", label: "Boyun", unit: "cm", min: 25, max: 55, placeholder: "ör: 38" },
  { key: "chest", label: "Göğüs", unit: "cm", min: 70, max: 150, placeholder: "ör: 100" },
  { key: "shoulder", label: "Omuz", unit: "cm", min: 80, max: 160, placeholder: "ör: 115" },
  { key: "waist", label: "Bel", unit: "cm", min: 55, max: 150, placeholder: "ör: 82" },
  { key: "hips", label: "Kalça", unit: "cm", min: 60, max: 150, placeholder: "ör: 95" },
  { key: "arm", label: "Kol", unit: "cm", min: 20, max: 55, placeholder: "ör: 35" },
  { key: "thigh", label: "Bacak", unit: "cm", min: 35, max: 80, placeholder: "ör: 55" },
  { key: "body_fat_pct", label: "Yağ Oranı", unit: "%", min: 3, max: 60, placeholder: "otomatik hesaplanır" },
  { key: "muscle_mass_kg", label: "Kas Kütlesi", unit: "kg", min: 20, max: 120, placeholder: "ör: 70" },
];

const activityOptions = [
  { value: "sedentary", label: "Hareketsiz", desc: "Masa başı iş, egzersiz yok" },
  { value: "light", label: "Hafif Aktif", desc: "Haftada 1-3 gün" },
  { value: "moderate", label: "Orta Aktif", desc: "Haftada 3-5 gün" },
  { value: "active", label: "Aktif", desc: "Haftada 6-7 gün" },
  { value: "very_active", label: "Çok Aktif", desc: "Günde 2 antrenman" },
];

const goalOptions = [
  { value: "cut", label: "Kilo Ver", desc: "TDEE - 500 kcal" },
  { value: "maintenance", label: "Koruma", desc: "TDEE" },
  { value: "bulk", label: "Kas Yap", desc: "TDEE + 300 kcal" },
];

const UpdateMeasurementsModal = ({ isOpen, onClose }: Props) => {
  const { latest, saveMeasurement } = useBodyMeasurements();
  const { profile, refreshProfile, user } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const profileAny = profile as Record<string, unknown> | null;
  const [heightCm, setHeightCm] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [fitnessGoal, setFitnessGoal] = useState("maintenance");

  const weightKg = profile?.current_weight ? Number(profile.current_weight) : null;

  useEffect(() => {
    if (isOpen) {
      if (latest) {
        const pre: Record<string, string> = {};
        fields.forEach(({ key }) => {
          if (key === "muscle_mass_kg") return;
          const val = latest[key as keyof typeof latest];
          if (val != null && !(key === "body_fat_pct" && Number(val) <= 0)) {
            pre[key] = String(val);
          }
        });
        setForm(pre);
      } else {
        setForm({});
      }

      setHeightCm(profileAny?.height_cm ? String(profileAny.height_cm) : "");
      setBirthDate(profileAny?.birth_date ? String(profileAny.birth_date) : "");
      setGender((profileAny?.gender as string) || "male");
      setActivityLevel((profileAny?.activity_level as string) || "moderate");
      setFitnessGoal((profileAny?.fitness_goal as string) || "maintenance");
    }
  }, [isOpen, latest, profileAny?.height_cm, profileAny?.birth_date, profileAny?.gender, profileAny?.activity_level, profileAny?.fitness_goal]);

  const navyEstimate =
    form.waist && form.neck && !form.body_fat_pct
      ? calcNavyBodyFat(Number(form.waist), Number(form.neck), heightCm ? Number(heightCm) : undefined)
      : null;

  const effectiveBf = form.body_fat_pct ? Number(form.body_fat_pct) : navyEstimate;
  const muscleEstimate =
    effectiveBf != null && weightKg != null
      ? calcMuscleMass(weightKg, effectiveBf)
      : null;

  const previewAge = birthDate
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const previewBMR =
    weightKg && heightCm && previewAge
      ? calcBMR(weightKg, Number(heightCm), previewAge, gender as "male" | "female")
      : null;
  const previewTDEE = previewBMR ? calcTDEE(previewBMR, activityLevel) : null;
  const previewMacros = previewTDEE && weightKg ? calcMacroTargets(weightKg, previewTDEE, fitnessGoal) : null;

  const getValidationError = (key: string, value: string): string | null => {
    if (!value) return null;
    const field = fields.find(f => f.key === key);
    if (!field || !field.min || !field.max) return null;
    const num = Number(value);
    if (num < field.min || num > field.max) return `${field.min}-${field.max} arası olmalı`;
    return null;
  };

  const hasValidationErrors = fields.some(({ key }) => {
    const v = form[key];
    return v ? getValidationError(key, v) !== null : false;
  });

  const handleSave = async () => {
    if (hasValidationErrors) {
      toast({ title: "Hata", description: "Ölçüm değerlerini kontrol edin", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (user) {
        const profileUpdate: Record<string, unknown> = {};
        if (heightCm) profileUpdate.height_cm = Number(heightCm);
        if (birthDate) profileUpdate.birth_date = birthDate;
        if (gender) profileUpdate.gender = gender;
        if (activityLevel) profileUpdate.activity_level = activityLevel;

        if (Object.keys(profileUpdate).length > 0) {
          const { error: pErr } = await supabase
            .from("profiles")
            .update(profileUpdate)
            .eq("id", user.id);
          if (pErr) console.error("Profile update error:", pErr.message);
          else await refreshProfile();
        }
      }

      const input: MeasurementInput = {};
      fields.forEach(({ key }) => {
        const v = form[key];
        (input as any)[key] = v ? Number(v) : null;
      });
      await saveMeasurement(input, weightKg);
      toast({ title: "Ölçümler kaydedildi ✅" });
      onClose();
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Kaydedilemedi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            ÖLÇÜMLERİ GÜNCELLE
          </DialogTitle>
        </DialogHeader>

        {/* Profile Fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserCog className="w-4 h-4" />
            PROFİL BİLGİLERİ
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Boy (cm)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="ör: 175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="h-9 bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Doğum Tarihi</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-9 bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cinsiyet</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-9 bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Aktivite Düzeyi</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger className="h-9 bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Measurement Fields */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-2">
          <Ruler className="w-4 h-4" />
          VÜCUT ÖLÇÜLERİ
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fields.map(({ key, label, unit, placeholder }) => {
            const error = form[key] ? getValidationError(key, form[key]) : null;
            return (
              <div key={key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {label} ({unit})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={placeholder || "—"}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  className={`h-9 bg-secondary/50 border-border ${error ? "border-destructive" : ""}`}
                />
                {error && <p className="text-destructive text-[10px]">{error}</p>}
              </div>
            );
          })}
        </div>

        {/* Estimates */}
        {(navyEstimate != null || muscleEstimate != null || previewBMR != null) && (
          <div className="mt-3 space-y-2">
            {navyEstimate != null && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">
                  Tahmini yağ oranı:{" "}
                  <span className="font-display text-primary">%{navyEstimate}</span>
                </p>
              </div>
            )}
            {muscleEstimate != null && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">
                  Tahmini LBM ({weightKg}kg × %{effectiveBf} yağ):{" "}
                  <span className="font-display text-primary">{muscleEstimate} kg</span>
                </p>
              </div>
            )}
            {previewBMR != null && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">
                  Bazal Metabolizma (BMR):{" "}
                  <span className="font-display text-primary">{previewBMR.toLocaleString()} kcal</span>
                </p>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full mt-4 font-display">
          {saving ? "KAYDEDİLİYOR..." : "KAYDET"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateMeasurementsModal;