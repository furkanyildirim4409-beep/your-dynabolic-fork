import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { calcNavyBodyFat, calcMuscleMass, useBodyMeasurements, type MeasurementInput } from "@/hooks/useBodyMeasurements";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Ruler, Calculator, UserCog, Scale } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const tapeFields: { key: keyof MeasurementInput; label: string; unit: string; min?: number; max?: number; placeholder?: string }[] = [
  { key: "neck", label: "Boyun", unit: "cm", min: 25, max: 55, placeholder: "ör: 38" },
  { key: "chest", label: "Göğüs", unit: "cm", min: 70, max: 150, placeholder: "ör: 100" },
  { key: "shoulder", label: "Omuz", unit: "cm", min: 80, max: 160, placeholder: "ör: 115" },
  { key: "waist", label: "Bel", unit: "cm", min: 55, max: 150, placeholder: "ör: 82" },
  { key: "hips", label: "Kalça", unit: "cm", min: 60, max: 150, placeholder: "ör: 95" },
  { key: "arm", label: "Kol", unit: "cm", min: 20, max: 55, placeholder: "ör: 35" },
  { key: "thigh", label: "Bacak", unit: "cm", min: 35, max: 80, placeholder: "ör: 55" },
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
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [fitnessGoal, setFitnessGoal] = useState("maintenance");

  useEffect(() => {
    if (isOpen) {
      if (latest) {
        const pre: Record<string, string> = {};
        tapeFields.forEach(({ key }) => {
          const val = latest[key as keyof typeof latest];
          if (val != null) pre[key] = String(val);
        });
        setForm(pre);
      } else {
        setForm({});
      }

      setWeightKg(profileAny?.current_weight ? String(profileAny.current_weight) : "");
      setHeightCm(profileAny?.height_cm ? String(profileAny.height_cm) : "");
      setBirthDate(profileAny?.birth_date ? String(profileAny.birth_date) : "");
      setGender((profileAny?.gender as string) || "male");
      setActivityLevel((profileAny?.activity_level as string) || "moderate");
      setFitnessGoal((profileAny?.fitness_goal as string) || "maintenance");
    }
  }, [isOpen, latest, profileAny?.current_weight, profileAny?.height_cm, profileAny?.birth_date, profileAny?.gender, profileAny?.activity_level, profileAny?.fitness_goal]);

  const weightNum = weightKg ? Number(weightKg) : null;
  const heightNum = heightCm ? Number(heightCm) : null;

  // Auto-calculate body fat using gender-aware Navy formula
  const navyEstimate =
    form.waist && form.neck && heightNum
      ? calcNavyBodyFat(
          Number(form.waist),
          Number(form.neck),
          heightNum,
          gender as "male" | "female",
          form.hips ? Number(form.hips) : null,
        )
      : null;

  const muscleEstimate =
    navyEstimate != null && weightNum != null
      ? calcMuscleMass(weightNum, navyEstimate)
      : null;

  const previewAge = birthDate
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const previewBMR =
    weightNum && heightNum && previewAge
      ? calcBMR(weightNum, heightNum, previewAge, gender as "male" | "female")
      : null;
  const previewTDEE = previewBMR ? calcTDEE(previewBMR, activityLevel) : null;
  const previewMacros = previewTDEE && weightNum ? calcMacroTargets(weightNum, previewTDEE, fitnessGoal) : null;

  const getValidationError = (key: string, value: string): string | null => {
    if (!value) return null;
    const field = tapeFields.find(f => f.key === key);
    if (!field || !field.min || !field.max) return null;
    const num = Number(value);
    if (num < field.min || num > field.max) return `${field.min}-${field.max} arası olmalı`;
    return null;
  };

  const hasValidationErrors = tapeFields.some(({ key }) => {
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
        if (weightKg) profileUpdate.current_weight = Number(weightKg);
        if (heightCm) profileUpdate.height_cm = Number(heightCm);
        if (birthDate) profileUpdate.birth_date = birthDate;
        if (gender) profileUpdate.gender = gender;
        if (activityLevel) profileUpdate.activity_level = activityLevel;
        profileUpdate.fitness_goal = fitnessGoal;

        if (previewMacros) {
          profileUpdate.daily_protein_target = previewMacros.protein;
          profileUpdate.daily_carb_target = previewMacros.carbs;
          profileUpdate.daily_fat_target = previewMacros.fat;
          profileUpdate.daily_calorie_target = previewMacros.calories;
        }

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
      tapeFields.forEach(({ key }) => {
        const v = form[key];
        (input as any)[key] = v ? Number(v) : null;
      });
      await saveMeasurement(input, weightNum, gender as "male" | "female", heightNum);
      toast({ title: "Ölçümler kaydedildi ✅" });
      onClose();
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Kaydedilemedi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const needsHipForFemale = gender === "female" && !form.hips && form.waist && form.neck;

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
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="w-3 h-3" /> Kilo (kg)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="ör: 75"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="h-9 bg-secondary/50 border-border"
                min={30}
                max={300}
              />
            </div>
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
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> Hedef
              </Label>
              <Select value={fitnessGoal} onValueChange={setFitnessGoal}>
                <SelectTrigger className="h-9 bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.desc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tape Measurement Fields */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-2">
          <Ruler className="w-4 h-4" />
          VÜCUT ÖLÇÜLERİ
        </div>

        {needsHipForFemale && (
          <div className="text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            ⚠️ Kadınlar için yağ oranı hesabında <strong>Kalça</strong> ölçümü zorunludur.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {tapeFields.map(({ key, label, unit, placeholder }) => {
            const error = form[key] ? getValidationError(key, form[key]) : null;
            return (
              <div key={key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {label} ({unit})
                  {key === "hips" && gender === "female" && <span className="text-yellow-500 ml-1">*</span>}
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

        {/* Auto-Calculated Read-Only Badges */}
        {(navyEstimate != null || muscleEstimate != null || previewBMR != null || previewMacros != null) && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calculator className="w-4 h-4" />
              OTOMATİK HESAPLAMA
            </div>

            {navyEstimate != null && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">
                  Yağ Oranı (U.S. Navy):{" "}
                  <span className="font-display text-primary">%{navyEstimate}</span>
                </p>
              </div>
            )}
            {muscleEstimate != null && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">
                  Yağsız Kütle (LBM):{" "}
                  <span className="font-display text-primary">{muscleEstimate} kg</span>
                </p>
              </div>
            )}
            {previewBMR != null && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
                <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-foreground">
                  BMR: <span className="font-display text-primary">{previewBMR.toLocaleString()} kcal</span>
                  {previewTDEE && <> → TDEE: <span className="font-display text-primary">{previewTDEE.toLocaleString()} kcal</span></>}
                </p>
              </div>
            )}
            {previewMacros != null && (
              <div className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-xs font-medium text-foreground">
                    Hedef Kalori: <span className="font-display text-primary">{previewMacros.calories.toLocaleString()} kcal</span>
                    <span className="text-muted-foreground ml-1">({goalOptions.find(g => g.value === fitnessGoal)?.label})</span>
                  </p>
                </div>
                <div className="flex gap-3 pl-6 text-[11px]">
                  <span className="text-foreground">P: <span className="font-display text-primary">{previewMacros.protein}g</span></span>
                  <span className="text-foreground">K: <span className="font-display text-primary">{previewMacros.carbs}g</span></span>
                  <span className="text-foreground">Y: <span className="font-display text-primary">{previewMacros.fat}g</span></span>
                </div>
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
