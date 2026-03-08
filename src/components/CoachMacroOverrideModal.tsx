import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calcBMR, calcTDEE, calcMacroTargets, type MacroTargets } from "@/hooks/useBodyMeasurements";
import { Target, Calculator, Beef, Wheat, Droplets, Flame, RotateCcw } from "lucide-react";

interface AthleteProfile {
  id: string;
  full_name: string | null;
  current_weight: number | null;
  height_cm: number | null;
  birth_date: string | null;
  gender: string | null;
  activity_level: string | null;
  fitness_goal: string | null;
  daily_protein_target: number | null;
  daily_carb_target: number | null;
  daily_fat_target: number | null;
  daily_calorie_target: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  athlete: AthleteProfile | null;
  onSaved: () => void;
}

const goalOptions = [
  { value: "cut", label: "Kilo Ver", desc: "TDEE - 500" },
  { value: "maintenance", label: "Koruma", desc: "TDEE" },
  { value: "bulk", label: "Kas Yap", desc: "TDEE + 300" },
];

const CoachMacroOverrideModal = ({ isOpen, onClose, athlete, onSaved }: Props) => {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [goal, setGoal] = useState("maintenance");
  const [saving, setSaving] = useState(false);

  // Populate form when athlete changes
  const populateFromAthlete = () => {
    if (!athlete) return;
    setCalories(athlete.daily_calorie_target ? String(athlete.daily_calorie_target) : "");
    setProtein(athlete.daily_protein_target ? String(athlete.daily_protein_target) : "");
    setCarbs(athlete.daily_carb_target ? String(athlete.daily_carb_target) : "");
    setFat(athlete.daily_fat_target ? String(athlete.daily_fat_target) : "");
    setGoal(athlete.fitness_goal || "maintenance");
  };

  // Auto-calculate suggestion from athlete's biometrics
  const getAutoSuggestion = (): MacroTargets | null => {
    if (!athlete?.current_weight || !athlete?.height_cm || !athlete?.birth_date) return null;
    const weight = Number(athlete.current_weight);
    const height = Number(athlete.height_cm);
    const gender = (athlete.gender as "male" | "female") ?? "male";
    const age = Math.floor(
      (Date.now() - new Date(athlete.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    const bmr = calcBMR(weight, height, age, gender);
    if (!bmr) return null;
    const tdee = calcTDEE(bmr, athlete.activity_level ?? "moderate");
    if (!tdee) return null;
    return calcMacroTargets(weight, tdee, goal);
  };

  const autoSuggestion = athlete ? getAutoSuggestion() : null;

  const applyAutoSuggestion = () => {
    if (!autoSuggestion) return;
    setCalories(String(autoSuggestion.calories));
    setProtein(String(autoSuggestion.protein));
    setCarbs(String(autoSuggestion.carbs));
    setFat(String(autoSuggestion.fat));
  };

  // Recalculate carbs from calories, protein, fat
  const recalcCarbs = () => {
    const cal = Number(calories);
    const p = Number(protein);
    const f = Number(fat);
    if (cal > 0 && p > 0 && f > 0) {
      const remaining = cal - p * 4 - f * 9;
      setCarbs(String(Math.max(0, Math.round(remaining / 4))));
    }
  };

  const handleSave = async () => {
    if (!athlete) return;
    const p = Number(protein);
    const c = Number(carbs);
    const f = Number(fat);
    const cal = Number(calories) || (p * 4 + c * 4 + f * 9);

    if (p <= 0 || c < 0 || f <= 0) {
      toast({ title: "Hata", description: "Makro değerlerini kontrol edin", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_protein_target: p,
          daily_carb_target: c,
          daily_fat_target: f,
          daily_calorie_target: cal,
          fitness_goal: goal,
        })
        .eq("id", athlete.id);

      if (error) throw error;

      toast({ title: "Makro hedefleri güncellendi ✅", description: `${athlete.full_name || "Sporcu"} için hedefler kaydedildi.` });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message || "Kaydedilemedi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClearTargets = async () => {
    if (!athlete) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_protein_target: null,
          daily_carb_target: null,
          daily_fat_target: null,
          daily_calorie_target: null,
        })
        .eq("id", athlete.id);

      if (error) throw error;

      toast({ title: "Hedefler sıfırlandı", description: "Sporcu kendi otomatik hesaplamasını kullanacak." });
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      onSaved();
    } catch (e: any) {
      toast({ title: "Hata", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Reset form when modal opens
  if (isOpen && athlete) {
    // Use a ref-like pattern to avoid re-renders
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); else populateFromAthlete(); }}>
      <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            MAKRO HEDEFLERİ — {athlete?.full_name || "Sporcu"}
          </DialogTitle>
        </DialogHeader>

        {/* Goal Selector */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hedef</Label>
          <Select value={goal} onValueChange={setGoal}>
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

        {/* Auto-suggestion banner */}
        {autoSuggestion && (
          <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Otomatik Öneri</span>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={applyAutoSuggestion}>
                Uygula
              </Button>
            </div>
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <span><Flame className="w-3 h-3 inline text-primary" /> {autoSuggestion.calories} kcal</span>
              <span>P: {autoSuggestion.protein}g</span>
              <span>K: {autoSuggestion.carbs}g</span>
              <span>Y: {autoSuggestion.fat}g</span>
            </div>
          </div>
        )}

        {/* Manual Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3" /> Hedef Kalori (kcal)
            </Label>
            <Input
              type="number"
              placeholder="ör: 2400"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="h-9 bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Beef className="w-3 h-3" /> Protein (g)
            </Label>
            <Input
              type="number"
              placeholder="ör: 180"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="h-9 bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Droplets className="w-3 h-3" /> Yağ (g)
            </Label>
            <Input
              type="number"
              placeholder="ör: 70"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              className="h-9 bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Wheat className="w-3 h-3" /> Karbonhidrat (g)
            </Label>
            <Input
              type="number"
              placeholder="ör: 250"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="h-9 bg-secondary/50 border-border"
            />
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="ghost" className="text-xs h-9 w-full" onClick={recalcCarbs}>
              <Calculator className="w-3 h-3 mr-1" />
              Karbı Hesapla
            </Button>
          </div>
        </div>

        {/* Preview */}
        {(Number(protein) > 0 || Number(carbs) > 0 || Number(fat) > 0) && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Toplam Kalori Özeti</p>
            <div className="flex gap-4 text-sm">
              <span className="text-foreground">P: <span className="text-primary font-display">{Number(protein) * 4}</span> kcal</span>
              <span className="text-foreground">K: <span className="text-primary font-display">{Number(carbs) * 4}</span> kcal</span>
              <span className="text-foreground">Y: <span className="text-primary font-display">{Number(fat) * 9}</span> kcal</span>
            </div>
            <p className="text-xs text-primary font-display mt-1">
              Toplam: {(Number(protein) * 4 + Number(carbs) * 4 + Number(fat) * 9).toLocaleString()} kcal
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1 font-display">
            {saving ? "KAYDEDİLİYOR..." : "KAYDET"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearTargets}
            disabled={saving}
            title="Hedefleri sıfırla (otomatiğe dön)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoachMacroOverrideModal;
