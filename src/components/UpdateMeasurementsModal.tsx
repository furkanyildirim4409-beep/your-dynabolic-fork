import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { calcNavyBodyFat, useBodyMeasurements, type MeasurementInput } from "@/hooks/useBodyMeasurements";
import { Ruler, Calculator } from "lucide-react";

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

const UpdateMeasurementsModal = ({ isOpen, onClose }: Props) => {
  const { latest, saveMeasurement } = useBodyMeasurements();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (latest) {
        const pre: Record<string, string> = {};
        fields.forEach(({ key }) => {
          // Skip pre-filling body_fat_pct if it's negative (invalid)
          const val = latest[key as keyof typeof latest];
          if (val != null && !(key === "body_fat_pct" && Number(val) <= 0)) {
            pre[key] = String(val);
          }
        });
        setForm(pre);
      } else {
        setForm({});
      }
    }
  }, [isOpen, latest]);

  const navyEstimate =
    form.waist && form.neck && !form.body_fat_pct
      ? calcNavyBodyFat(Number(form.waist), Number(form.neck))
      : null;

  // Validate ranges
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
      const input: MeasurementInput = {};
      fields.forEach(({ key }) => {
        const v = form[key];
        (input as any)[key] = v ? Number(v) : null;
      });
      await saveMeasurement(input);
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

        <div className="grid grid-cols-2 gap-3 mt-2">
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

        {navyEstimate != null && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
            <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground">
              Navy formülü tahmini yağ oranı:{" "}
              <span className="font-display text-primary">%{navyEstimate}</span>
            </p>
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
