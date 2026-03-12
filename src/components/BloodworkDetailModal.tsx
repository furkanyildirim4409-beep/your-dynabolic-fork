import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Sparkles, ShoppingCart, PackagePlus, Check, Save, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { generateSupplementSuggestions } from "@/lib/supplementSuggestions";
import type { BloodTestBiomarker, BloodTest } from "@/hooks/useBloodTests";

/* ─── Props ─── */
interface BloodworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: BloodTestBiomarker[];
  coachNotes?: string | null;
  testDate?: string;
  allTests: BloodTest[];
  mode?: "athlete" | "coach";
  testId?: string;
  onNotesSaved?: () => void;
}

const BloodworkDetailModal = ({
  isOpen, onClose, extractedData, coachNotes, allTests,
  mode = "athlete", testId, onNotesSaved,
}: BloodworkDetailModalProps) => {
  const [notes, setNotes] = useState(coachNotes || "");
  const [saving, setSaving] = useState(false);
  const [addedToStock, setAddedToStock] = useState<Set<string>>(new Set());
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const biomarkers = extractedData || [];
  const flagged = biomarkers.filter((b) => b.status === "low" || b.status === "high");
  const suggestions = generateSupplementSuggestions(biomarkers);

  // Hormone trend from all tests
  const sortedTests = [...allTests]
    .filter((t) => t.status === "analyzed" && t.extracted_data?.length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  const hormoneTrends = sortedTests.map((t) => {
    const testo = t.extracted_data.find((b) => b.name === "Testosteron");
    const cortisol = t.extracted_data.find((b) => b.name === "Kortizol");
    const month = new Date(t.date).toLocaleDateString("tr-TR", { month: "short" });
    return { month, testosterone: testo?.value || 0, cortisol: cortisol?.value || 0 };
  });

  const handleSaveNotes = async () => {
    if (!testId) return;
    setSaving(true);
    const { error } = await supabase.from("blood_tests").update({ coach_notes: notes }).eq("id", testId);
    setSaving(false);
    if (error) {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kaydedildi ✅", description: "Koç notu başarıyla güncellendi." });
      onNotesSaved?.();
    }
  };

  const handleAddStock = (name: string) => {
    setAddedToStock((prev) => new Set(prev).add(name));
    toast({ title: "✅ Stoğa Eklendi", description: `${name} envanterinize eklendi.` });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="min-h-screen bg-background pt-4 pb-24"
        >
          {/* Header */}
          <div className="px-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Kan Tahlili Detayları</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Flagged Values Alert */}
          {flagged.length > 0 && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{flagged.length} değer dikkat gerektiriyor</span>
              </div>
              <p className="text-muted-foreground text-xs">
                {flagged.map((f) => f.name).join(", ")} değerleri referans aralığı dışında.
              </p>
            </div>
          )}

          {/* Hormone Trends Chart */}
          {hormoneTrends.length > 1 && (
            <div className="mx-4 mb-6">
              <h3 className="text-foreground text-sm font-medium mb-3">Hormon Trendi</h3>
              <div className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hormoneTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 15%)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <Tooltip contentStyle={{ background: "hsl(240 6% 4%)", border: "1px solid hsl(240 4% 15%)", borderRadius: 8, fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="testosterone" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Testosteron" />
                    <Line yAxisId="right" type="monotone" dataKey="cortisol" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="Kortizol" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-blue-500 rounded" /><span className="text-xs text-muted-foreground">Testosteron</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-amber-500 rounded" /><span className="text-xs text-muted-foreground">Kortizol</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Biomarker List */}
          <div className="mx-4">
            <h3 className="text-foreground text-sm font-medium mb-3">Tüm Biyobelirteçler</h3>
            <div className="space-y-2">
              {biomarkers.map((marker) => (
                <div
                  key={marker.name}
                  className={`backdrop-blur-xl bg-card border rounded-xl p-3 ${
                    marker.status !== "normal" ? "border-yellow-500/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {marker.status === "normal" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : marker.status === "low" ? (
                        <TrendingDown className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-foreground text-sm font-medium">{marker.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${marker.status === "normal" ? "text-foreground" : "text-yellow-400"}`}>
                        {marker.value} {marker.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-muted-foreground text-xs">Referans: {marker.ref}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      marker.status === "normal" ? "bg-green-500/10 text-green-400" :
                      marker.status === "low" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {marker.status === "normal" ? "Normal" : marker.status === "low" ? "Düşük" : "Yüksek"}
                    </span>
                  </div>
                </div>
              ))}
              {biomarkers.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Henüz biyobelirteç verisi yok.</p>
              )}
            </div>
          </div>

          {/* ✨ Gemini AI Supplement Suggestions (Athlete mode only) */}
          {mode === "athlete" && suggestions.length > 0 && (
            <div className="mx-4 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-foreground text-sm font-medium">Gemini AI Analizi & Takviye Önerileri</h3>
              </div>
              <div className="space-y-3">
                {suggestions.map((s) => {
                  const isInStock = addedToStock.has(s.name);
                  return (
                    <div
                      key={s.id}
                      className="relative rounded-xl p-[1px] overflow-hidden"
                      style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(220 80% 60%), hsl(270 80% 60%))" }}
                    >
                      <div className="bg-background rounded-[11px] p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground text-sm font-semibold">{s.name}</p>
                            <p className="text-muted-foreground text-xs mt-1">{s.reason}</p>
                            <p className="text-primary text-sm font-bold mt-1">{s.price}₺</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isInStock ? (
                            <div className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-green-500/10 text-green-400 rounded-xl text-sm font-medium">
                              <Check className="w-4 h-4" />Stokta Var
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 gap-2 text-xs"
                                onClick={() => addToCart({ id: s.id, title: s.name, price: s.price, image: s.image, type: "supplement" })}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />Sepete Ekle
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2 text-xs"
                                onClick={() => handleAddStock(s.name)}
                              >
                                <PackagePlus className="w-3.5 h-3.5" />Stoğuma Ekle
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coach Notes */}
          {mode === "coach" ? (
            <div className="mx-4 mt-6">
              <div className="backdrop-blur-xl bg-card border border-primary/20 rounded-xl p-4 space-y-3">
                <p className="text-primary text-xs font-medium">Koç Notu</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sporcu için notunuzu yazın..."
                  className="min-h-[80px] bg-secondary/50 border-border text-sm"
                />
                <Button onClick={handleSaveNotes} disabled={saving} className="w-full gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Kaydediliyor..." : "Notu Kaydet"}
                </Button>
              </div>
            </div>
          ) : coachNotes ? (
            <div className="mx-4 mt-6">
              <div className="backdrop-blur-xl bg-card border border-primary/20 rounded-xl p-4">
                <p className="text-primary text-xs font-medium mb-1">Koç Notu</p>
                <p className="text-muted-foreground text-sm">{coachNotes}</p>
              </div>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BloodworkDetailModal;
